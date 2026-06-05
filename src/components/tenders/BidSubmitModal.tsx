import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  FileText,
  Phone,
  Clock,
  RefreshCw,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { formatKenyaPhone, validateKenyaPhone, displayPhone } from '@/lib/phoneUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BidSubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderId: string;
  tenderTitle: string;
  tenderValue: number;
}

interface BidApplication {
  id: string;
  tender_id: string;
  supplier_id: string;
  status: string;
  processing_fee: number;
  mpesa_checkout_request_id?: string;
  mpesa_transaction_code?: string;
  payment_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  documents?: UploadedDocument[];
}

interface UploadedDocument {
  id: string;
  application_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size_bytes?: number;
  mime_type?: string;
  uploaded_at: string;
}

interface UploadedDocState {
  type: 'technical_proposal' | 'company_profile' | 'additional';
  document?: UploadedDocument;
  uploading: boolean;
  error?: string;
}

interface BidForm {
  bid_amount: string;
  completion_timeline_days: string;
  technical_proposal: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 5_000;
const COUNTDOWN_SECONDS = 60;

const REQUIRED_DOCS: { type: 'technical_proposal' | 'company_profile'; label: string; accept: string; hint: string }[] =
  [
    {
      type: 'technical_proposal',
      label: 'Technical Proposal',
      accept: '.pdf',
      hint: 'PDF only — required',
    },
    {
      type: 'company_profile',
      label: 'Company Profile',
      accept: '.pdf,.docx,.doc',
      hint: 'PDF or DOCX — required',
    },
  ];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatKES(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(num);
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Payment' },
    { num: 2, label: 'Documents' },
    { num: 3, label: 'Bid Details' },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-6 mt-1">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.num;
        const isActive = currentStep === step.num;
        return (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-muted-foreground/30 text-muted-foreground',
                ].join(' ')}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.num}
              </div>
              <span
                className={[
                  'text-[10px] font-medium leading-none',
                  isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={[
                  'h-0.5 w-12 mx-1 mb-4 rounded transition-all',
                  currentStep > step.num ? 'bg-green-400' : 'bg-muted-foreground/20',
                ].join(' ')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

export function BidSubmitModal({
  open,
  onOpenChange,
  tenderId,
  tenderTitle,
  tenderValue,
}: BidSubmitModalProps) {
  const { profile, onboardingStatus } = useAuth();
  const { toast } = useToast();

  // Step: 0=eligibility check, 1=payment, 2=documents, 3=bid details, 4=success
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Application state
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [submittedBid, setSubmittedBid] = useState<{
    id: string;
    bid_amount: number;
    completion_timeline_days: number;
  } | null>(null);

  // Step 1 — Payment
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [countdownExpired, setCountdownExpired] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 2 — Documents
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDocState>>({
    technical_proposal: { type: 'technical_proposal', uploading: false },
    company_profile: { type: 'company_profile', uploading: false },
    additional_1: { type: 'additional', uploading: false },
    additional_2: { type: 'additional', uploading: false },
    additional_3: { type: 'additional', uploading: false },
  });

  // Step 3 — Bid form
  const [bidForm, setBidForm] = useState<BidForm>({
    bid_amount: '',
    completion_timeline_days: '',
    technical_proposal: '',
  });

  // Pre-fill phone from profile
  useEffect(() => {
    if (profile?.phone_number) {
      setPhoneNumber(displayPhone(profile.phone_number));
    }
  }, [profile?.phone_number]);

  // Eligibility check + resume on modal open
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setError(null);
    runEligibilityCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Timers
  // ---------------------------------------------------------------------------

  const clearTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    countdownRef.current = null;
    pollRef.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
    setCountdownExpired(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setCountdownExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startPolling = useCallback(
    (appId: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const app = await api.get<BidApplication>(`/bid-applications/${appId}`);
          if (app.status === 'payment_confirmed' || app.status === 'documents_uploaded' || app.status === 'submitted') {
            clearTimers();
            setApplicationStatus(app.status);
            setStep(2);
            toast({ title: 'Payment confirmed!', description: 'Your M-Pesa payment was received.' });
          }
        } catch {
          // silently ignore poll errors
        }
      }, POLL_INTERVAL_MS);
    },
    [clearTimers, toast],
  );

  // ---------------------------------------------------------------------------
  // Step 0 — Eligibility check
  // ---------------------------------------------------------------------------

  const runEligibilityCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if supplier is approved
      if (profile?.user_type !== 'supplier' || onboardingStatus !== 'approved') {
        setStep(1); // We'll block in step 1 render; actually show blocker
        // Use a special "blocked" state
        setError(
          profile?.user_type !== 'supplier'
            ? 'Only approved suppliers can submit bids.'
            : 'Your supplier account must be approved before bidding. Complete onboarding first.',
        );
        setStep(-1); // blocker
        setLoading(false);
        return;
      }

      // Check for existing application
      const existing = await api.get<BidApplication | null>(
        `/bid-applications/check?tender_id=${tenderId}`,
      );

      if (existing) {
        setApplicationId(existing.id);
        setApplicationStatus(existing.status);

        if (existing.status === 'submitted') {
          // Already submitted — go to success with limited info
          setStep(4);
        } else if (existing.status === 'payment_confirmed' || existing.status === 'documents_uploaded') {
          // Resume at documents
          if (existing.documents && existing.documents.length > 0) {
            const restoredDocs = { ...uploadedDocs };
            let additionalIdx = 1;
            existing.documents.forEach((doc) => {
              if (doc.document_type === 'technical_proposal' || doc.document_type === 'company_profile') {
                restoredDocs[doc.document_type] = {
                  type: doc.document_type as 'technical_proposal' | 'company_profile',
                  document: doc,
                  uploading: false,
                };
              } else if (additionalIdx <= 3) {
                restoredDocs[`additional_${additionalIdx}`] = {
                  type: 'additional',
                  document: doc,
                  uploading: false,
                };
                additionalIdx++;
              }
            });
            setUploadedDocs(restoredDocs);
          }
          setStep(2);
        } else if (existing.status === 'payment_pending') {
          // Resume at payment — user needs to try again
          setStep(1);
        } else {
          setStep(1);
        }
      } else {
        setStep(1);
      }
    } catch {
      // If check fails, just go to step 1
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Step 1 — Initiate Payment
  // ---------------------------------------------------------------------------

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    if (!validateKenyaPhone(phoneNumber)) {
      setPhoneError('Enter a valid Kenyan phone number (e.g. 0712345678 or +254712345678)');
      return;
    }

    const formatted = formatKenyaPhone(phoneNumber);

    try {
      setLoading(true);
      setError(null);

      const res = await api.post<{ application_id: string; checkout_request_id: string; message: string }>(
        '/bid-applications',
        { tender_id: tenderId, phone_number: formatted },
      );

      setApplicationId(res.application_id);
      setApplicationStatus('payment_pending');
      setPaymentInitiated(true);
      startCountdown();
      startPolling(res.application_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate payment.';

      // Handle 409 — existing application in a confirmed state
      if (msg.includes('already have an active application')) {
        toast({ title: 'Application exists', description: msg });
        // Try to load it
        await runEligibilityCheck();
        return;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPollCheck = async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const app = await api.get<BidApplication>(`/bid-applications/${applicationId}`);
      if (app.status === 'payment_confirmed' || app.status === 'documents_uploaded') {
        clearTimers();
        setApplicationStatus(app.status);
        setStep(2);
        toast({ title: 'Payment confirmed!', description: 'Your M-Pesa payment was received.' });
      } else {
        toast({
          title: 'Payment not yet confirmed',
          description: 'Please complete the M-Pesa prompt on your phone.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Check failed', description: 'Could not verify payment status.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    clearTimers();
    setPaymentInitiated(false);
    setCountdown(COUNTDOWN_SECONDS);
    setCountdownExpired(false);
    setApplicationId(null);
    setApplicationStatus(null);
    setError(null);
  };

  // ---------------------------------------------------------------------------
  // Step 2 — Document Upload
  // ---------------------------------------------------------------------------

  const handleFileUpload = async (
    key: string,
    docType: string,
    file: File,
  ) => {
    if (!applicationId) return;

    setUploadedDocs((prev) => ({
      ...prev,
      [key]: { ...prev[key], uploading: true, error: undefined },
    }));

    try {
      const doc = await api.post<UploadedDocument>(
        `/bid-applications/${applicationId}/documents`,
        {
          document_type: docType,
          file_name: file.name,
          file_url: `/uploads/fake/${file.name}`,
          file_size_bytes: file.size,
          mime_type: file.type,
        },
      );

      setUploadedDocs((prev) => ({
        ...prev,
        [key]: { ...prev[key], document: doc, uploading: false },
      }));

      // Update local application status
      setApplicationStatus('documents_uploaded');

      toast({ title: 'Document uploaded', description: `${file.name} uploaded successfully.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setUploadedDocs((prev) => ({
        ...prev,
        [key]: { ...prev[key], uploading: false, error: msg },
      }));
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
    }
  };

  const requiredDocsUploaded =
    !!uploadedDocs.technical_proposal.document && !!uploadedDocs.company_profile.document;

  // ---------------------------------------------------------------------------
  // Step 3 — Submit Bid
  // ---------------------------------------------------------------------------

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;

    const bidAmount = parseFloat(bidForm.bid_amount.replace(/,/g, ''));
    const timelineDays = parseInt(bidForm.completion_timeline_days);

    if (isNaN(bidAmount) || bidAmount <= 0) {
      toast({ title: 'Invalid bid amount', description: 'Enter a positive number.', variant: 'destructive' });
      return;
    }
    if (isNaN(timelineDays) || timelineDays <= 0) {
      toast({ title: 'Invalid timeline', description: 'Enter a positive number of days.', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const bid = await api.post<{ id: string; bid_amount: number; completion_timeline_days: number }>(
        `/bid-applications/${applicationId}/submit`,
        {
          bid_amount: bidAmount,
          completion_timeline_days: timelineDays,
          technical_proposal: bidForm.technical_proposal || null,
        },
      );
      setSubmittedBid(bid);
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed.';
      setError(msg);
      toast({ title: 'Submission failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Reset & Close
  // ---------------------------------------------------------------------------

  const handleClose = useCallback(() => {
    clearTimers();
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setStep(0);
      setError(null);
      setApplicationId(null);
      setApplicationStatus(null);
      setPaymentInitiated(false);
      setCountdown(COUNTDOWN_SECONDS);
      setCountdownExpired(false);
      setSubmittedBid(null);
      setBidForm({ bid_amount: '', completion_timeline_days: '', technical_proposal: '' });
      setUploadedDocs({
        technical_proposal: { type: 'technical_proposal', uploading: false },
        company_profile: { type: 'company_profile', uploading: false },
        additional_1: { type: 'additional', uploading: false },
        additional_2: { type: 'additional', uploading: false },
        additional_3: { type: 'additional', uploading: false },
      });
    }, 300);
  }, [clearTimers, onOpenChange]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const formattedEstimate = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(tenderValue);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Submit a Bid</DialogTitle>
          <DialogDescription className="line-clamp-2 text-sm">{tenderTitle}</DialogDescription>
        </DialogHeader>

        {/* ── Step 0: Loading eligibility ── */}
        {step === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking eligibility…</p>
          </div>
        )}

        {/* ── Step -1: Blocker ── */}
        {step === -1 && (
          <div className="py-6 space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* ── Steps 1–3: Show indicator ── */}
        {step >= 1 && step <= 3 && <StepIndicator currentStep={step} />}

        {/* ── Step 1: Payment ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Tender info */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Tender Estimate
              </p>
              <p className="text-base font-semibold">{formattedEstimate}</p>
            </div>

            {/* Fee notice */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                A non-refundable processing fee of{' '}
                <strong>KES 1,000</strong> is required via M-Pesa to proceed.
              </p>
            </div>

            {!paymentInitiated ? (
              <form onSubmit={handleInitiatePayment} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="phone_number">
                    M-Pesa Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone_number"
                      type="tel"
                      placeholder="+254712345678 or 0712345678"
                      className={`pl-9 ${phoneError ? 'border-destructive' : ''}`}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setPhoneError('');
                      }}
                    />
                  </div>
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Initiate M-Pesa Payment (KES 1,000)
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Phone confirmation */}
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">M-Pesa prompt sent</p>
                    <p className="text-xs text-muted-foreground">
                      Check your phone — request sent to{' '}
                      <span className="font-semibold text-foreground">{phoneNumber}</span>
                    </p>
                  </div>
                </div>

                {/* Countdown */}
                {!countdownExpired ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Waiting for payment confirmation…
                      </span>
                      <Badge variant="outline" className="font-mono">
                        {countdown}s
                      </Badge>
                    </div>
                    <Progress value={((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100} className="h-1.5" />
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Payment not confirmed. Please try again or retry the STK prompt.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleManualPollCheck}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    I've paid, check again
                  </Button>
                  {countdownExpired && (
                    <Button variant="secondary" onClick={handleRetryPayment}>
                      Retry Payment
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Document Upload ── */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Upload the required documents below. Both are mandatory before proceeding.
            </p>

            {/* Required documents */}
            <div className="space-y-3">
              {REQUIRED_DOCS.map((req) => {
                const docState = uploadedDocs[req.type];
                return (
                  <DocumentUploadRow
                    key={req.type}
                    label={req.label}
                    hint={req.hint}
                    accept={req.accept}
                    state={docState}
                    required
                    onFileSelect={(file) => handleFileUpload(req.type, req.type, file)}
                  />
                );
              })}
            </div>

            {/* Optional additional docs */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Additional Supporting Documents (Optional, up to 3)
              </p>
              <div className="space-y-2 mt-2">
                {[1, 2, 3].map((idx) => {
                  const key = `additional_${idx}`;
                  const docState = uploadedDocs[key];
                  // Only show next slot if previous slot is filled
                  const prevKey = `additional_${idx - 1}`;
                  if (idx > 1 && !uploadedDocs[prevKey].document) return null;
                  return (
                    <DocumentUploadRow
                      key={key}
                      label={`Supporting Document ${idx}`}
                      hint="Any format"
                      accept="*"
                      state={docState}
                      required={false}
                      onFileSelect={(file) => handleFileUpload(key, 'additional', file)}
                    />
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!requiredDocsUploaded}
              onClick={() => setStep(3)}
            >
              Continue to Bid Details
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── Step 3: Bid Details ── */}
        {step === 3 && (
          <form onSubmit={handleSubmitBid} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              Tender estimate:{' '}
              <span className="font-medium text-foreground">{formattedEstimate}</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bid_amount">
                Your Bid Amount (KES) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">KES</span>
                <Input
                  id="bid_amount"
                  type="text"
                  inputMode="numeric"
                  className="pl-12"
                  placeholder="e.g. 5,000,000"
                  value={bidForm.bid_amount}
                  onChange={(e) => {
                    // Allow only digits and commas
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    const formatted = raw ? parseInt(raw, 10).toLocaleString('en-KE') : '';
                    setBidForm({ ...bidForm, bid_amount: formatted });
                  }}
                />
              </div>
              {bidForm.bid_amount && (
                <p className="text-xs text-muted-foreground">
                  {formatKES(bidForm.bid_amount.replace(/,/g, ''))}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timeline">
                Completion Timeline (Days) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="timeline"
                type="number"
                min="1"
                placeholder="e.g. 90"
                value={bidForm.completion_timeline_days}
                onChange={(e) => setBidForm({ ...bidForm, completion_timeline_days: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="technical_proposal">
                Technical Proposal Summary{' '}
                <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                You've already uploaded a Technical Proposal PDF. This field is for a brief summary.
              </p>
              <Textarea
                id="technical_proposal"
                rows={4}
                placeholder="Briefly describe your approach, methodology, and team qualifications…"
                value={bidForm.technical_proposal}
                onChange={(e) => setBidForm({ ...bidForm, technical_proposal: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Bid
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Bid Submitted Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                Your bid has been received and is under review.
              </p>
            </div>

            {(applicationId || submittedBid) && (
              <div className="w-full rounded-lg border bg-muted/30 p-4 text-left space-y-2">
                {applicationId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bid Reference</span>
                    <span className="font-mono font-medium text-xs break-all">{applicationId}</span>
                  </div>
                )}
                {submittedBid?.bid_amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Submitted Amount</span>
                    <span className="font-medium">{formatKES(submittedBid.bid_amount)}</span>
                  </div>
                )}
                {submittedBid?.completion_timeline_days && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completion Timeline</span>
                    <span className="font-medium">{submittedBid.completion_timeline_days} days</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Track your bid status in your supplier dashboard.
            </p>

            <Button onClick={handleClose} className="w-full max-w-[200px] mt-2">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Document Upload Row Sub-component
// ---------------------------------------------------------------------------

interface DocumentUploadRowProps {
  label: string;
  hint: string;
  accept: string;
  state: UploadedDocState;
  required: boolean;
  onFileSelect: (file: File) => void;
}

function DocumentUploadRow({ label, hint, accept, state, required, onFileSelect }: DocumentUploadRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={[
        'rounded-lg border p-3 space-y-2 transition-colors',
        state.document
          ? 'border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800'
          : 'border-muted-foreground/20 bg-background',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText
            className={`h-4 w-4 shrink-0 ${state.document ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
          />
          <span className="text-sm font-medium truncate">{label}</span>
          {required && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
              Required
            </Badge>
          )}
        </div>
        {state.document ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs shrink-0"
            disabled={state.uploading}
            onClick={() => inputRef.current?.click()}
          >
            {state.uploading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            {state.uploading ? 'Uploading…' : 'Choose File'}
          </Button>
        )}
      </div>

      {/* File info after upload */}
      {state.document && (
        <div className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5 pl-6">
          <span className="truncate font-medium">{state.document.file_name}</span>
          {state.document.file_size_bytes && (
            <span className="text-muted-foreground shrink-0">
              ({formatBytes(state.document.file_size_bytes)})
            </span>
          )}
        </div>
      )}

      {/* Upload progress */}
      {state.uploading && <Progress value={undefined} className="h-1 mt-1" />}

      {/* Error */}
      {state.error && (
        <p className="text-xs text-destructive pl-6">{state.error}</p>
      )}

      {/* Hint */}
      {!state.document && (
        <p className="text-[11px] text-muted-foreground pl-6">{hint}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          // Reset input so same file can be re-selected
          e.target.value = '';
        }}
      />
    </div>
  );
}
