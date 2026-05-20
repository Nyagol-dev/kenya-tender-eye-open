import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, FileText, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Tender {
  id: string;
  title: string;
  reference: string;
  sector: string;
  value: number;
  closingDate: string;
  status: string;
  issuingAuthority: string;
  description?: string;
}

interface TenderFormData {
  title: string;
  reference_number: string;
  description: string;
  sector: string;
  value: string;
  closing_date: string;
}

const EMPTY_FORM: TenderFormData = {
  title: '',
  reference_number: '',
  description: '',
  sector: '',
  value: '',
  closing_date: '',
};

const SECTORS = [
  'Infrastructure', 'Healthcare', 'Education', 'ICT', 'Agriculture',
  'Security', 'Water & Sanitation', 'Transport', 'Energy', 'Housing',
  'Environment', 'Finance', 'General Supplies',
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-green-100 text-green-700 border-green-200' },
  'under-review': { label: 'Under Review', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  awarded: { label: 'Awarded', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}

export default function GovernmentEntityPortalPage() {
  const { user, profile, loadingInitial } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<TenderFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Redirect if not a government entity
  useEffect(() => {
    if (!loadingInitial) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (profile && profile.user_type !== 'government_entity') {
        navigate('/');
      }
    }
  }, [user, profile, loadingInitial, navigate]);

  const fetchTenders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Tender[] }>('/tenders');
      setTenders(res.data || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load tenders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && profile?.user_type === 'government_entity') {
      fetchTenders();
    }
  }, [user, profile, fetchTenders]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.reference_number || !formData.closing_date) {
      toast({ title: 'Missing fields', description: 'Title, reference number, and closing date are required.', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/tenders', {
        title: formData.title,
        reference_number: formData.reference_number,
        description: formData.description || null,
        sector: formData.sector || null,
        value: formData.value ? parseFloat(formData.value) : null,
        closing_date: formData.closing_date,
      });
      toast({ title: 'Tender created', description: 'Your tender has been published successfully.' });
      setCreateOpen(false);
      setFormData(EMPTY_FORM);
      fetchTenders();
    } catch (e: any) {
      toast({ title: 'Failed to create tender', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTenders =
    activeTab === 'all' ? tenders : tenders.filter(t => t.status === activeTab);

  // Stats
  const stats = {
    total: tenders.length,
    open: tenders.filter(t => t.status === 'open').length,
    underReview: tenders.filter(t => t.status === 'under-review').length,
    awarded: tenders.filter(t => t.status === 'awarded').length,
  };

  if (loadingInitial) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Procurement Portal</h1>
            <p className="text-muted-foreground mt-1">
              {profile?.entity_name || 'Government Entity'} — manage your tenders and track bid submissions.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Publish New Tender
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tenders', value: stats.total, icon: <FileText className="h-5 w-5" />, color: 'text-slate-600' },
            { label: 'Open', value: stats.open, icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-600' },
            { label: 'Under Review', value: stats.underReview, icon: <Clock className="h-5 w-5" />, color: 'text-yellow-600' },
            { label: 'Awarded', value: stats.awarded, icon: <CheckCircle className="h-5 w-5" />, color: 'text-blue-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`${s.color} opacity-80`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tender List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tenders</CardTitle>
            <CardDescription>All tenders published by your entity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
                <TabsTrigger value="under-review">Under Review ({stats.underReview})</TabsTrigger>
                <TabsTrigger value="awarded">Awarded ({stats.awarded})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTenders.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No tenders found</p>
                    <p className="text-sm mt-1">
                      {activeTab === 'all'
                        ? 'Publish your first tender to get started.'
                        : `No tenders with status "${activeTab}".`}
                    </p>
                    {activeTab === 'all' && (
                      <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Publish Tender
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-3 px-2 font-medium">Reference</th>
                          <th className="text-left py-3 px-2 font-medium">Title</th>
                          <th className="text-left py-3 px-2 font-medium">Sector</th>
                          <th className="text-left py-3 px-2 font-medium">Value (KES)</th>
                          <th className="text-left py-3 px-2 font-medium">Closing Date</th>
                          <th className="text-left py-3 px-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredTenders.map(t => (
                          <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{t.reference}</td>
                            <td className="py-3 px-2 font-medium max-w-[280px] truncate" title={t.title}>{t.title}</td>
                            <td className="py-3 px-2">{t.sector || '—'}</td>
                            <td className="py-3 px-2">
                              {t.value ? new Intl.NumberFormat('en-KE').format(t.value) : '—'}
                            </td>
                            <td className="py-3 px-2">{t.closingDate}</td>
                            <td className="py-3 px-2">
                              <StatusBadge status={t.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create Tender Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setFormData(EMPTY_FORM); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publish New Tender</DialogTitle>
            <DialogDescription>
              Fill in the details below. All published tenders are immediately visible to registered suppliers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="t_title">Tender Title *</Label>
              <Input
                id="t_title"
                required
                placeholder="e.g. Supply and Installation of Solar Panels"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="t_ref">Reference Number *</Label>
                <Input
                  id="t_ref"
                  required
                  placeholder="e.g. KE-MOE-2026-001"
                  value={formData.reference_number}
                  onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="t_sector">Sector</Label>
                <Select value={formData.sector} onValueChange={v => setFormData({ ...formData, sector: v })}>
                  <SelectTrigger id="t_sector">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="t_value">Estimated Value (KES)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">KES</span>
                  <Input
                    id="t_value"
                    type="number"
                    min="0"
                    step="10000"
                    className="pl-12"
                    placeholder="e.g. 5000000"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="t_closing">Closing Date *</Label>
                <Input
                  id="t_closing"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.closing_date}
                  onChange={e => setFormData({ ...formData, closing_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="t_desc">Description</Label>
              <Textarea
                id="t_desc"
                rows={5}
                placeholder="Describe the scope of work, deliverables, eligibility requirements, and any other relevant details..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="bg-muted/40 rounded-md p-3 flex gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Once published, this tender will be visible to all registered suppliers. The reference number must be unique.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish Tender
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
