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

/** Default request timeout for Daraja calls (30 seconds). */
const MPESA_TIMEOUT_MS = 30_000;

/**
 * Heavily-defensive HTTPS JSON request for the Daraja API.
 *
 * Handles every known Daraja Sandbox quirk:
 *  – Empty-string response bodies (status 400 / 401 / 503)
 *  – Non-JSON error pages (HTML 502 from reverse-proxy)
 *  – Hung connections (30-second timeout)
 *
 * The resolved value is always `{ statusCode, body }`.
 * On any failure the rejected Error carries `.statusCode` and `.endpoint`
 * properties for structured upstream handling.
 *
 * @param {string|URL} url
 * @param {import('https').RequestOptions} options
 * @param {string|Object} [body]
 * @returns {Promise<{ statusCode: number, body: Object }>}
 */
function httpsRequest(url, options, body) {
  const endpoint = typeof url === 'string' ? url : url.toString();

  return new Promise((resolve, reject) => {
    /** Helper: build an Error with extra context fields. */
    const fail = (message, statusCode) => {
      const err = new Error(message);
      err.statusCode = statusCode ?? 0;
      err.endpoint = endpoint;
      return err;
    };

    logger.debug({ msg: '[M-Pesa] request →', method: options.method ?? 'GET', endpoint });

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });

      res.on('end', () => {
        // ----- Guard 1: completely empty body --------------------------------
        if (!data || !data.trim()) {
          const msg =
            `Daraja API returned an empty body with status ${res.statusCode} — endpoint: ${endpoint}`;
          logger.error({
            msg: '[M-Pesa] Empty response',
            statusCode: res.statusCode,
            endpoint,
          });
          return reject(fail(msg, res.statusCode));
        }

        // ----- Guard 2: non-JSON body (HTML error pages, plain text, etc.) ---
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (parseErr) {
          const snippet = data.slice(0, 300).replace(/\n/g, ' ');
          const msg =
            `Failed to parse Daraja JSON from ${endpoint} ` +
            `(status ${res.statusCode}): ${snippet}`;
          logger.error({
            msg: '[M-Pesa] JSON parse error',
            statusCode: res.statusCode,
            endpoint,
            rawBody: data.slice(0, 500),
            parseError: parseErr.message,
          });
          return reject(fail(msg, res.statusCode));
        }

        // ----- Success: surface status code to callers -----------------------
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    // ----- Guard 3: timeout --------------------------------------------------
    req.setTimeout(MPESA_TIMEOUT_MS, () => {
      req.destroy();
      const msg =
        `Daraja API request timed out after ${MPESA_TIMEOUT_MS}ms — endpoint: ${endpoint}`;
      logger.error({ msg: '[M-Pesa] Timeout', endpoint, timeoutMs: MPESA_TIMEOUT_MS });
      reject(fail(msg, 504));
    });

    // ----- Guard 4: network / TLS / DNS errors -------------------------------
    req.on('error', (err) => {
      // If we already destroyed via timeout, the error is ECONNRESET — skip
      // duplicate rejection by checking if the promise was already settled.
      logger.error({
        msg: '[M-Pesa] Network error',
        endpoint,
        error: err.message,
        code: err.code,
      });
      reject(fail(
        `M-Pesa network error for ${endpoint}: ${err.message}`,
        err.code === 'ECONNREFUSED' ? 503 : 0,
      ));
    });

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
