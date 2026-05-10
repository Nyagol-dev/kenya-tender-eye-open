import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, clearAdminToken } from '../lib/adminApi';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  Activity,
  LogOut,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AdminSupplierDetailDrawer } from '../components/admin/AdminSupplierDetailDrawer';
import { AdminBidDetailDrawer } from '../components/admin/AdminBidDetailDrawer';
import { formatDistanceToNow } from 'date-fns';

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [isSupplierDrawerOpen, setIsSupplierDrawerOpen] = useState(false);
  const [isBidDrawerOpen, setIsBidDrawerOpen] = useState(false);

  const handleLogout = () => {
    clearAdminToken();
    window.location.href = '/admin/login';
  };

  const handleViewSupplier = (id: string) => {
    setSelectedSupplierId(id);
    setIsSupplierDrawerOpen(true);
  };

  const handleViewBid = (id: string) => {
    setSelectedBidId(id);
    setIsBidDrawerOpen(true);
  };

  const openSupplierFromElsewhere = (id: string) => {
    setActiveTab('suppliers');
    handleViewSupplier(id);
  };

  // Queries for badge counts and overview
  const { data: dashboardData } = useQuery({
    queryKey: ['admin_dashboard'],
    queryFn: () => adminApi.get<any>('/dashboard'),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['admin_alerts'],
    queryFn: () => adminApi.get<any>('/alerts'),
  });

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 shadow-xl z-10">
        <div className="h-16 flex items-center px-6 bg-slate-950/50 border-b border-slate-800">
          <span className="font-bold text-white text-lg tracking-tight">Admin Portal</span>
        </div>
        
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            isActive={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Suppliers" 
            isActive={activeTab === 'suppliers'} 
            onClick={() => setActiveTab('suppliers')} 
            badgeCount={dashboardData?.pendingSuppliersCount || 0}
            badgeColor="bg-yellow-500 text-yellow-950"
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Bids" 
            isActive={activeTab === 'bids'} 
            onClick={() => setActiveTab('bids')} 
            badgeCount={dashboardData?.underReviewBidsCount || 0}
            badgeColor="bg-blue-500 text-blue-50"
          />
          <NavItem 
            icon={<ClipboardList size={20} />} 
            label="Tenders" 
            isActive={activeTab === 'tenders'} 
            onClick={() => setActiveTab('tenders')} 
          />
          <NavItem 
            icon={<Activity size={20} />} 
            label="Activity Log" 
            isActive={activeTab === 'activity'} 
            onClick={() => setActiveTab('activity')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-3 py-2 rounded-md hover:bg-slate-800"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-8 max-w-7xl mx-auto min-h-full">
          {activeTab === 'overview' && (
            <OverviewTab 
              dashboardData={dashboardData} 
              alertsData={alertsData} 
              onSwitchToSuppliers={() => setActiveTab('suppliers')}
              onReviewSupplier={handleViewSupplier}
            />
          )}
          {activeTab === 'suppliers' && (
            <SuppliersTab onViewDetails={handleViewSupplier} />
          )}
          {activeTab === 'bids' && (
            <BidsTab onViewDetails={handleViewBid} />
          )}
          {activeTab === 'tenders' && (
            <TendersTab onFilterBids={(tenderId) => {
              // We could pass state to Bids tab to filter, but for now just switch
              setActiveTab('bids');
            }} />
          )}
          {activeTab === 'activity' && (
            <ActivityTab />
          )}
        </div>
      </main>

      {/* DRAWERS */}
      <AdminSupplierDetailDrawer 
        userId={selectedSupplierId} 
        open={isSupplierDrawerOpen} 
        onOpenChange={setIsSupplierDrawerOpen} 
      />
      
      <AdminBidDetailDrawer 
        bidId={selectedBidId} 
        open={isBidDrawerOpen} 
        onOpenChange={setIsBidDrawerOpen} 
        onViewSupplier={openSupplierFromElsewhere}
      />

    </div>
  );
}

function NavItem({ icon, label, isActive, onClick, badgeCount, badgeColor }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {badgeCount > 0 && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor || 'bg-slate-700 text-slate-300'}`}>
          {badgeCount}
        </span>
      )}
    </button>
  );
}

function OverviewTab({ dashboardData, alertsData, onSwitchToSuppliers, onReviewSupplier }: any) {
  
  const { data: pendingSuppliers } = useQuery({
    queryKey: ['admin_suppliers_pending'],
    queryFn: () => adminApi.get<any>('/suppliers?status=submitted&limit=5'),
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* TOP ROW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Total Suppliers" value={dashboardData?.totalSuppliers || 0} subtitle="Approved" />
        <StatCard title="Pending Onboarding" value={dashboardData?.pendingSuppliersCount || 0} subtitle="Requires review" valueColor="text-yellow-600" />
        <StatCard title="Active Tenders" value={dashboardData?.activeTenders || 0} subtitle="Open for bids" valueColor="text-green-600" />
        <StatCard title="Pending Bids" value={dashboardData?.pendingBidsCount || 0} subtitle="Submitted" valueColor="text-blue-600" />
        <StatCard 
          title="System Alerts" 
          value={alertsData?.length || 0} 
          subtitle="Unread notifications" 
          valueColor={(alertsData?.length || 0) > 0 ? "text-red-600" : "text-slate-900"} 
        />
      </div>

      {/* MIDDLE ROW PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Onboarding Panel */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Pending Onboarding</CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-600" onClick={onSwitchToSuppliers}>
              View All <ChevronRight size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {pendingSuppliers?.suppliers?.map((supplier: any) => (
                <div key={supplier.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">{supplier.entity_name || 'Unnamed Supplier'}</p>
                    <p className="text-sm text-slate-500">{supplier.email}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Submitted {supplier.updated_at ? formatDistanceToNow(new Date(supplier.updated_at), { addSuffix: true }) : 'recently'}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => onReviewSupplier(supplier.id)}>Review</Button>
                </div>
              ))}
              {(!pendingSuppliers?.suppliers || pendingSuppliers.suppliers.length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircleIcon className="h-10 w-10 mx-auto text-green-200 mb-2" />
                  <p>All caught up! No pending suppliers.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts Panel */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              {alertsData?.slice(0, 6).map((alert: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                    alert.severity === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                    alert.severity === 'medium' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                    'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 leading-snug">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </span>
                      {alert.target_link && (
                        <a href={alert.target_link} className="text-xs text-blue-600 hover:underline">View details</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!alertsData || alertsData.length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  <p>No new system alerts.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, valueColor = "text-slate-900" }: any) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-5">
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className={`text-3xl font-bold tracking-tight ${valueColor}`}>{value}</p>
        <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function SuppliersTab({ onViewDetails }: { onViewDetails: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin_suppliers', searchTerm, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      return adminApi.get<any>(`/suppliers?${params.toString()}`);
    },
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">Pending</Badge>;
      case 'submitted': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200">Submitted</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200">Rejected</Badge>;
      case 'expired': return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers Management</h1>
          <p className="text-slate-500 text-sm mt-1">Review and manage supplier onboarding and profiles.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, email or registration..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Step</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading suppliers...</td>
                </tr>
              ) : data?.suppliers?.length > 0 ? (
                data.suppliers.map((supplier: any) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{supplier.entity_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{supplier.email}</td>
                    <td className="px-6 py-4 text-slate-600">{supplier.service_category?.name || 'N/A'}</td>
                    <td className="px-6 py-4">{renderStatusBadge(supplier.status)}</td>
                    <td className="px-6 py-4 text-slate-600">{supplier.current_step || 1}/4</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => onViewDetails(supplier.id)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No suppliers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination could go here */}
        <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-slate-50 text-sm text-slate-600 mt-auto">
          <span>Showing {data?.suppliers?.length || 0} suppliers</span>
        </div>
      </div>
    </div>
  );
}

function BidsTab({ onViewDetails }: { onViewDetails: (id: string) => void }) {
  const [tenderFilter, setTenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin_bids', tenderFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (tenderFilter) params.append('tender_id', tenderFilter); // assuming backend supports this search
      if (statusFilter !== 'all') params.append('status', statusFilter);
      return adminApi.get<any>(`/bids?${params.toString()}`);
    },
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return <Badge variant="secondary" className="bg-slate-100 text-slate-600">Submitted</Badge>;
      case 'under_review': return <Badge className="bg-blue-100 text-blue-700">Under Review</Badge>;
      case 'shortlisted': return <Badge className="bg-purple-100 text-purple-700">Shortlisted</Badge>;
      case 'awarded': return <Badge className="bg-green-100 text-green-700">Awarded</Badge>;
      case 'rejected': return <Badge variant="destructive" className="bg-red-100 text-red-700">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bid Submissions</h1>
          <p className="text-slate-500 text-sm mt-1">Review, shortlist, and award tender bids.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Filter by tender reference..." 
            className="pl-9"
            value={tenderFilter}
            onChange={(e) => setTenderFilter(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="awarded">Awarded</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Tender Ref</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Amount (KES)</th>
                <th className="px-6 py-4">Timeline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading bids...</td>
                </tr>
              ) : data?.bids?.length > 0 ? (
                data.bids.map((bid: any) => (
                  <tr key={bid.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{bid.tender?.reference_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{bid.supplier?.entity_name || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium">{Number(bid.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">{bid.timeline_days} days</td>
                    <td className="px-6 py-4">{renderStatusBadge(bid.status)}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(bid.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => onViewDetails(bid.id)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No bids found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-slate-50 text-sm text-slate-600 mt-auto">
          <span>Showing {data?.bids?.length || 0} bids</span>
        </div>
      </div>
    </div>
  );
}

function TendersTab({ onFilterBids }: { onFilterBids: (tenderId: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin_tenders'],
    queryFn: () => adminApi.get<any>('/tenders'), // Assuming /admin/tenders or we reuse main api
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tenders Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Quick view of all system tenders.</p>
        </div>
        <Button>Create Tender</Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Closing Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading tenders...</td>
                </tr>
              ) : data?.tenders?.length > 0 ? (
                data.tenders.map((tender: any) => (
                  <tr key={tender.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{tender.reference_number}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-[300px] truncate">{tender.title}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize">{tender.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(tender.closing_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => onFilterBids(tender.id)}>
                        View Bids
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No tenders available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActivityTab() {
  // Placeholder for Activity Log
  const { data, isLoading } = useQuery({
    queryKey: ['admin_activity'],
    queryFn: () => adminApi.get<any>('/activity').catch(() => ({ activity: [] })),
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Log</h1>
          <p className="text-slate-500 text-sm mt-1">Audit trail of administrative actions.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col items-center justify-center">
        {isLoading ? (
          <p className="text-slate-500">Loading activity...</p>
        ) : data?.activity?.length > 0 ? (
          <div className="w-full h-full overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.activity.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 text-slate-900">{log.admin_name || log.admin_id}</td>
                    <td className="px-6 py-4 text-slate-600">{log.action}</td>
                    <td className="px-6 py-4 text-slate-600">{log.target_id}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No Activity Logged</h3>
            <p className="text-slate-500">Activity logging endpoint is not fully implemented yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
