import { useEffect, useState, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PendingSupplier {
  id: string;
  full_name: string | null;
  email: string | null;
  user_type: string;
  registration_number: string | null;
  location: string | null;
  created_at: string;
}

const AdminApprovalsPage = () => {
  const [suppliers, setSuppliers] = useState<PendingSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PendingSupplier[]>("/admin/suppliers/pending");
      setSuppliers(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load pending suppliers.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/suppliers/${id}/approve`, { status });
      toast({
        title: status === "approved" ? "Supplier Approved" : "Supplier Rejected",
        description: `Supplier has been ${status}.`,
      });
      // Remove from local list immediately
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Action failed.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Supplier Approvals</CardTitle>
                <CardDescription>
                  Review and approve or reject pending supplier registrations.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {suppliers.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No pending approvals</p>
                <p className="text-sm mt-1">All supplier registrations have been reviewed.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reg. Number</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">
                          {supplier.full_name ?? "—"}
                        </TableCell>
                        <TableCell>{supplier.email ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {supplier.user_type === "supplier" ? "Supplier" : "Gov. Entity"}
                          </Badge>
                        </TableCell>
                        <TableCell>{supplier.registration_number ?? "—"}</TableCell>
                        <TableCell>{supplier.location ?? "—"}</TableCell>
                        <TableCell>
                          {new Date(supplier.created_at).toLocaleDateString("en-KE", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={actionLoading === supplier.id}
                              onClick={() => handleAction(supplier.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={actionLoading === supplier.id}
                              onClick={() => handleAction(supplier.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminApprovalsPage;
