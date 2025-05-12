
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/dashboard/StatCard";
import TenderChart from "@/components/dashboard/TenderChart";
import TenderStatusChart from "@/components/dashboard/TenderStatusChart";
import SectorDistribution from "@/components/dashboard/SectorDistribution";
import TenderList from "@/components/tenders/TenderList";
import { MOCK_TENDERS } from "@/mock/tenderData";
import { Link } from "react-router-dom";
import { FileSearch, Tag, Wallet } from "lucide-react";

const Index = () => {
  // Get only the first 3 tenders for the home page
  const recentTenders = MOCK_TENDERS.slice(0, 3);
  
  return (
    <MainLayout>
      <div className="container py-8 space-y-8">
        {/* Hero section */}
        <section className="text-center py-16 bg-gradient-to-r from-kenya-green/10 to-kenya-red/10 rounded-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kenya e-Procurement System</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transparent procurement for efficient government spending and public accountability
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/tenders">Browse Tenders</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/suppliers">Supplier Directory</Link>
            </Button>
          </div>
        </section>
        
        {/* Stats section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Procurement Dashboard</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard 
              title="Active Tenders" 
              value="247" 
              icon={<FileSearch className="h-4 w-4" />}
              description="Open for bidding"
            />
            <StatCard 
              title="Total Value" 
              value="KES 24.3B" 
              icon={<Wallet className="h-4 w-4" />}
              description="Current fiscal year"
            />
            <StatCard 
              title="Awarded Contracts" 
              value="183" 
              icon={<Tag className="h-4 w-4" />}
              description="Year to date"
            />
          </div>
        </section>
        
        {/* Charts section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Analytics Overview</h2>
          <div className="grid gap-4 md:grid-cols-6">
            <TenderChart />
            <TenderStatusChart />
            <SectorDistribution />
          </div>
        </section>
        
        {/* Recent tenders */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recent Tenders</h2>
            <Button variant="outline" asChild>
              <Link to="/tenders">View All</Link>
            </Button>
          </div>
          <TenderList tenders={recentTenders} />
        </section>
        
        {/* Feature boxes */}
        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <p>All procurement data is accessible to the public for accountability and oversight. Track tenders from publication to completion.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Streamlined digital processes save time and resources for both government agencies and suppliers participating in tenders.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Equal access to opportunities for all qualified suppliers to ensure fair competition and optimal value for public spending.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
