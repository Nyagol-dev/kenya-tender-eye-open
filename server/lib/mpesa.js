/**
 * M-Pesa Daraja API integration (Sandbox / Production).
 *
 * Uses only the built-in `https` module — no extra dependencies.
 *
 * Required env vars:
 *   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET,
 *   MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL
 */
const https = require('https');
const logger = require('./logger');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lightweight HTTPS JSON request using built-in `https` module.
 * Returns a Promise that resolves with the parsed JSON body.
 */
function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          reject(new Error(`Failed to parse M-Pesa response: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Generate a Daraja-compatible timestamp (YYYYMMDDHHmmss).
 */
function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch an OAuth access token from Daraja.
 * @returns {Promise<string>} Bearer access token
 */
async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const url = new URL('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials');

  const { statusCode, body } = await httpsRequest(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (statusCode !== 200 || !body.access_token) {
    logger.error({ msg: 'M-Pesa OAuth failed', statusCode, body });
    throw new Error('Failed to obtain M-Pesa access token');
  }

  return body.access_token;
}

/**
 * Initiate an M-Pesa STK Push (Lipa Na M-Pesa Online).
 *
 * @param {Object} params
 * @param {string} params.phoneNumber  – Subscriber number (e.g. 254712345678)
 * @param {number} params.amount       – Amount in KES
 * @param {string} params.accountReference – Account/reference string
 * @param {string} params.transactionDesc  – Human-readable description
 * @returns {Promise<Object>} Full Daraja STK Push response
 */
async function initiateSTKPush({ phoneNumber, amount, accountReference, transactionDesc }) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackURL = process.env.MPESA_CALLBACK_URL;

  if (!shortcode || !passkey || !callbackURL) {
    throw new Error('MPESA_SHORTCODE, MPESA_PASSKEY, and MPESA_CALLBACK_URL must be set');
  }

  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const token = await getAccessToken();

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackURL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const url = new URL('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest');

  const { statusCode, body } = await httpsRequest(
    url,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
    payload
  );

  logger.info({ msg: 'STK Push response', statusCode, checkoutRequestId: body.CheckoutRequestID });

  if (statusCode !== 200 || body.ResponseCode !== '0') {
    logger.error({ msg: 'STK Push failed', statusCode, body });
    const err = new Error(body.errorMessage || body.ResponseDescription || 'STK Push request failed');
    err.statusCode = 502;
    throw err;
  }

  return body;
}

/**
 * Validate the structure of an M-Pesa callback payload.
 *
 * @param {Object} body – The raw req.body from the callback
 * @returns {{ resultCode: number, checkoutRequestId: string, receiptNumber: string|null }}
 */
function verifyCallback(body) {
  const stkCallback = body?.Body?.stkCallback;

  if (!stkCallback) {
    throw new Error('Invalid M-Pesa callback structure: missing Body.stkCallback');
  }

  const { ResultCode, CheckoutRequestID, CallbackMetadata } = stkCallback;

  if (ResultCode === undefined || !CheckoutRequestID) {
    throw new Error('Invalid M-Pesa callback: missing ResultCode or CheckoutRequestID');
  }

  let receiptNumber = null;

  if (ResultCode === 0 && CallbackMetadata?.Item) {
    const receiptItem = CallbackMetadata.Item.find(
      (item) => item.Name === 'MpesaReceiptNumber'
    );
    receiptNumber = receiptItem?.Value || null;
  }

  return {
    resultCode: ResultCode,
    checkoutRequestId: CheckoutRequestID,
    receiptNumber,
  };
}

module.exports = {
  getAccessToken,
  initiateSTKPush,
  verifyCallback,
};
