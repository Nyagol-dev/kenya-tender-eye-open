import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BidSubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderId: string;
  tenderTitle: string;
  tenderValue: number;
}

export function BidSubmitModal({
  open,
  onOpenChange,
  tenderId,
  tenderTitle,
  tenderValue,
}: BidSubmitModalProps) {
  const { profile, onboardingStatus } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    bid_amount: '',
    technical_proposal: '',
    completion_timeline_days: '',
  });

  const isApprovedSupplier =
    profile?.user_type === 'supplier' && onboardingStatus === 'approved';

  const formattedEstimate = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(tenderValue);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApprovedSupplier) return;

    const bidAmount = parseFloat(form.bid_amount);
    const timelineDays = parseInt(form.completion_timeline_days);

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
      await api.post('/bids', {
        tender_id: tenderId,
        bid_amount: bidAmount,
        technical_proposal: form.technical_proposal || null,
        completion_timeline_days: timelineDays,
        bid_documents: [],
      });
      setSubmitted(true);
      toast({ title: 'Bid submitted!', description: 'Your bid has been submitted successfully.' });
    } catch (err: any) {
      toast({
        title: 'Submission failed',
        description: err.message || 'Could not submit bid.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSubmitted(false);
    setForm({ bid_amount: '', technical_proposal: '', completion_timeline_days: '' });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Submit a Bid</DialogTitle>
          <DialogDescription className="line-clamp-2">{tenderTitle}</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Bid Submitted Successfully</h3>
            <p className="text-sm text-muted-foreground text-center">
              Your bid has been received. You can track its status in your profile.
            </p>
            <Button onClick={handleClose} className="mt-2">Close</Button>
          </div>
        ) : (
          <>
            {!isApprovedSupplier && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {profile?.user_type !== 'supplier'
                    ? 'Only approved suppliers can submit bids.'
                    : 'Your supplier account must be approved before bidding. Complete onboarding first.'}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                Tender estimate: <span className="font-medium text-foreground">{formattedEstimate}</span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bid_amount">Your Bid Amount (KES) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">KES</span>
                  <Input
                    id="bid_amount"
                    type="number"
                    min="1"
                    step="1000"
                    required
                    disabled={!isApprovedSupplier}
                    className="pl-12"
                    placeholder="e.g. 5000000"
                    value={form.bid_amount}
                    onChange={e => setForm({ ...form, bid_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeline">Completion Timeline (Days) *</Label>
                <Input
                  id="timeline"
                  type="number"
                  min="1"
                  required
                  disabled={!isApprovedSupplier}
                  placeholder="e.g. 90"
                  value={form.completion_timeline_days}
                  onChange={e => setForm({ ...form, completion_timeline_days: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="proposal">Technical Proposal (Optional)</Label>
                <Textarea
                  id="proposal"
                  rows={4}
                  disabled={!isApprovedSupplier}
                  placeholder="Describe your approach, methodology, team qualifications, and why you are the best fit..."
                  value={form.technical_proposal}
                  onChange={e => setForm({ ...form, technical_proposal: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !isApprovedSupplier}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Bid
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
