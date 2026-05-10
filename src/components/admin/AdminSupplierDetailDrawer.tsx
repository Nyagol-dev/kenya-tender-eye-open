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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Loader2, CheckCircle2, FileText, XCircle } from 'lucide-react';

interface AdminSupplierDetailDrawerProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSupplierDetailDrawer({
  userId,
  open,
  onOpenChange,
}: AdminSupplierDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['admin_supplier', userId],
    queryFn: () => adminApi.get<any>(`/suppliers/${userId}`),
    enabled: !!userId && open,
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { decision: 'approve' | 'reject'; rejection_reason?: string }) =>
      adminApi.post(`/suppliers/${userId}/review`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin_supplier', userId] });
      setRejectDialogOpen(false);
      onOpenChange(false);
    },
  });

  const handleApprove = () => {
    reviewMutation.mutate({ decision: 'approve' });
  };

  const handleReject = () => {
    reviewMutation.mutate({ decision: 'reject', rejection_reason: rejectionReason });
  };

  if (!open) return null;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'submitted': return <Badge className="bg-blue-500">Submitted</Badge>;
      case 'approved': return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'expired': return <Badge className="bg-orange-500">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] w-[90vw] overflow-y-auto pb-24">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl flex items-center gap-3">
            Supplier Details
            {supplier && renderStatusBadge(supplier.status)}
          </SheetTitle>
          <SheetDescription>
            Review supplier information, documents, and bidding history.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : supplier ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="bids">Bids</TabsTrigger>
              <TabsTrigger value="previous">Previous Work</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Company Name</p>
                  <p className="font-medium">{supplier.entity_name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium">{supplier.email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Registration Number</p>
                  <p className="font-medium">{supplier.registration_number || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="font-medium">{supplier.location || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Service Category</p>
                  <p className="font-medium">{supplier.service_category?.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Onboarding Step</p>
                  <p className="font-medium">{supplier.current_step || 1} / 4</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Required Documents Checklist</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {['certificate_of_incorporation', 'kra_compliance', 'cr12', 'tax_compliance'].map((docType) => {
                    const hasDoc = supplier.documents?.some((d: any) => d.document_type === docType);
                    return (
                      <div key={docType} className="flex items-center gap-2">
                        {hasDoc ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                        <span className="capitalize">{docType.replace(/_/g, ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.documents?.map((doc: any) => (
                  <div key={doc.id} className="border rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="capitalize">
                          {doc.document_type.replace(/_/g, ' ')}
                        </Badge>
                        {doc.is_verified && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                      <p className="text-sm font-medium truncate mb-1" title={doc.file_name}>
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full mt-4" 
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Document
                    </Button>
                  </div>
                ))}
                {(!supplier.documents || supplier.documents.length === 0) && (
                  <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bids" className="space-y-4">
              {supplier.bids && supplier.bids.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Tender</th>
                        <th className="px-4 py-3 font-medium">Amount (KES)</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplier.bids.map((bid: any) => (
                        <tr key={bid.id} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium">{bid.tender?.title || 'Unknown Tender'}</td>
                          <td className="px-4 py-3">{Number(bid.amount).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">{bid.status.replace(/_/g, ' ')}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-4">No bids submitted yet.</p>
              )}
            </TabsContent>

            <TabsContent value="previous" className="space-y-4">
              {supplier.previous_projects && supplier.previous_projects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {supplier.previous_projects.map((project: any, i: number) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{project.name}</h4>
                        <span className="text-sm font-medium bg-slate-100 px-2 py-1 rounded">
                          {project.year}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 block text-xs uppercase">Client</span>
                          <span className="font-medium">{project.client}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs uppercase">Contract Value</span>
                          <span className="font-medium">KES {Number(project.value).toLocaleString()}</span>
                        </div>
                        <div className="col-span-2 mt-2">
                          <span className="text-gray-500 block text-xs uppercase">Duration</span>
                          <span className="font-medium">{project.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-4">No previous work recorded.</p>
              )}
            </TabsContent>
          </Tabs>
        ) : null}

        {/* Sticky Bottom Action Bar */}
        {supplier && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {supplier.status === 'submitted' && (
              <>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={reviewMutation.isPending}
                >
                  Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleApprove}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending && reviewMutation.variables?.decision === 'approve' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve Supplier
                </Button>
              </>
            )}

            {supplier.status === 'approved' && (
              <div className="flex items-center gap-4 w-full justify-between">
                <span className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> This supplier is approved
                </span>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  Revoke Approval
                </Button>
              </div>
            )}

            {supplier.status === 'rejected' && (
              <div className="flex items-center gap-4 w-full">
                <span className="text-sm font-medium text-red-600 flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> Rejected
                </span>
                <span className="text-sm text-gray-600 italic">
                  Reason: {supplier.rejection_reason || 'No reason provided'}
                </span>
              </div>
            )}
            
            {supplier.status === 'pending' && (
               <div className="flex items-center gap-4 w-full">
                <span className="text-sm font-medium text-gray-500">
                  Onboarding in progress ({supplier.current_step || 1}/4)
                </span>
              </div>
            )}
          </div>
        )}

      </SheetContent>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Supplier</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">Rejection Reason (Required)</label>
            <Textarea
              placeholder="Please explain why this supplier is being rejected. This will be sent to the supplier."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || reviewMutation.isPending}
            >
              {reviewMutation.isPending && reviewMutation.variables?.decision === 'reject' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
