import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/adminApi';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, ExternalLink, CheckCircle2, User, Briefcase, FileText } from 'lucide-react';

interface AdminBidDetailDrawerProps {
  bidId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewSupplier: (supplierId: string) => void;
}

export function AdminBidDetailDrawer({
  bidId,
  open,
  onOpenChange,
  onViewSupplier,
}: AdminBidDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);

  const { data: bidData, isLoading } = useQuery({
    queryKey: ['admin_bid', bidId],
    queryFn: () => adminApi.get<any>(`/bids/${bidId}`),
    enabled: !!bidId && open,
  });

  const reviewMutation = useMutation({
    mutationFn: (decision: string) =>
      adminApi.post(`/bids/${bidId}/review`, { decision }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_bids'] });
      queryClient.invalidateQueries({ queryKey: ['admin_bid', bidId] });
      setAwardDialogOpen(false);
      // Close drawer if awarded or rejected maybe?
      // Let's just keep it open to show new status unless specified otherwise.
    },
  });

  const handleAction = (decision: string) => {
    if (decision === 'award') {
      setAwardDialogOpen(true);
    } else {
      reviewMutation.mutate(decision);
    }
  };

  if (!open) return null;

  const bid = bidData?.bid;
  const otherBids = bidData?.other_bids || [];

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return <Badge variant="secondary">Submitted</Badge>;
      case 'under_review': return <Badge className="bg-blue-500">Under Review</Badge>;
      case 'shortlisted': return <Badge className="bg-purple-500">Shortlisted</Badge>;
      case 'awarded': return <Badge className="bg-green-500">Awarded</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDoc = (docs: any[], type: string) => docs?.find((d) => d.document_type === type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[900px] w-[90vw] overflow-y-auto pb-24">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl flex items-center gap-3">
            Bid Details
            {bid && renderStatusBadge(bid.status)}
          </SheetTitle>
          <SheetDescription>
            {bid ? `For Tender: ${bid.tender?.title || bid.tender_id}` : 'Loading...'}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : bid ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Bid Details */}
            <div className="md:col-span-2 space-y-6">
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Bid Amount</p>
                  <p className="text-xl font-bold text-gray-900">KES {Number(bid.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Proposed Timeline</p>
                  <p className="text-xl font-bold text-gray-900">{bid.timeline_days} days</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Technical Proposal</h3>
                <ScrollArea className="h-48 w-full rounded-md border p-4 bg-slate-50">
                  <p className="text-sm whitespace-pre-wrap font-mono text-gray-700">
                    {bid.technical_proposal || 'No technical proposal text provided.'}
                  </p>
                </ScrollArea>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Bid Documents</h3>
                {bid.documents && bid.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bid.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium truncate" title={doc.file_name || doc.name}>
                            {doc.file_name || doc.name}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="flex-shrink-0" asChild>
                          <a href={doc.file_url || doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No documents attached.</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Other Bids on this Tender</h3>
                {otherBids.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-2 font-medium">Supplier</th>
                          <th className="px-4 py-2 font-medium">Amount (KES)</th>
                          <th className="px-4 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherBids.map((ob: any) => (
                          <tr key={ob.id} className="border-b last:border-0 hover:bg-slate-50/50">
                            <td className="px-4 py-2 truncate max-w-[150px]">{ob.supplier?.entity_name || 'Unknown'}</td>
                            <td className="px-4 py-2">{Number(ob.amount).toLocaleString()}</td>
                            <td className="px-4 py-2 capitalize">{ob.status.replace(/_/g, ' ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No other bids found.</p>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Supplier Credentials Panel */}
            <div className="space-y-6">
              
              <div className="border rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{bid.supplier?.entity_name || 'Unknown Supplier'}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      {bid.supplier?.email}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Badge variant="outline" className={bid.supplier?.status === 'approved' ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                    Profile Status: {bid.supplier?.status || 'Unknown'}
                  </Badge>
                </div>

                <div className="space-y-3 text-sm mb-5">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-right">{bid.supplier?.service_category?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Experience</span>
                    <span className="font-medium">{bid.supplier?.years_experience || 'N/A'} years</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Max Contract</span>
                    <span className="font-medium">
                      {bid.supplier?.max_contract_value ? `KES ${Number(bid.supplier.max_contract_value).toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    onViewSupplier(bid.supplier_id);
                  }}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>
              </div>

              <div className="border rounded-lg p-5 shadow-sm">
                <h3 className="font-semibold mb-3">Key Credentials</h3>
                <div className="space-y-3">
                  {[
                    { type: 'certificate_of_incorporation', label: 'Cert. of Incorporation' },
                    { type: 'kra_compliance', label: 'KRA Compliance' }
                  ].map((docDef) => {
                    const doc = getDoc(bid.supplier?.documents || [], docDef.type);
                    return (
                      <div key={docDef.type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {doc?.is_verified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-400" />
                          )}
                          <span>{docDef.label}</span>
                        </div>
                        {doc ? (
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-red-500">Missing</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        ) : null}

        {/* Bottom Action Bar */}
        {bid && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            
            {bid.status === 'submitted' && (
              <>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleAction('reject')} disabled={reviewMutation.isPending}>Reject</Button>
                <Button variant="secondary" onClick={() => handleAction('under_review')} disabled={reviewMutation.isPending}>Mark Under Review</Button>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleAction('shortlist')} disabled={reviewMutation.isPending}>Shortlist</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction('award')} disabled={reviewMutation.isPending}>Award</Button>
              </>
            )}

            {bid.status === 'under_review' && (
              <>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleAction('reject')} disabled={reviewMutation.isPending}>Reject</Button>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleAction('shortlist')} disabled={reviewMutation.isPending}>Shortlist</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction('award')} disabled={reviewMutation.isPending}>Award</Button>
              </>
            )}

            {bid.status === 'shortlisted' && (
              <>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleAction('reject')} disabled={reviewMutation.isPending}>Reject</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction('award')} disabled={reviewMutation.isPending}>Award</Button>
              </>
            )}

            {(bid.status === 'awarded' || bid.status === 'rejected') && (
              <span className="text-sm font-medium text-gray-500 self-center mr-4">
                This bid has been finalized as {bid.status}.
              </span>
            )}
          </div>
        )}

      </SheetContent>

      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Award</DialogTitle>
            <DialogDescription>
              This will mark the tender as awarded and close it. All other bids will be rejected. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAwardDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={() => reviewMutation.mutate('award')}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending && reviewMutation.variables === 'award' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm Award
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
