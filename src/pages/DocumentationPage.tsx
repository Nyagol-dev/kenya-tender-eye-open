
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import flowchartPdf from "/flowchart.pdf";
import systemFlowchart from "/system-flowchart.png";
import { Link } from "react-router-dom";

const DocumentationPage = () => {
  return (
    <MainLayout>
      <div className="container py-8 space-y-8">
        <section className="text-center py-12 bg-gradient-to-r from-kenya-green/10 to-kenya-red/10 rounded-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">System Documentation</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Understanding the Kenya e-Procurement System workflow and architecture
          </p>
        </section>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>System Flowchart</CardTitle>
            <CardDescription>Visual representation of the e-Procurement system workflow</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <img 
              src={systemFlowchart} 
              alt="System Flowchart" 
              className="max-w-full rounded-lg shadow-md mb-6 border"
            />
            
            <div className="flex gap-4 flex-col sm:flex-row justify-center">
              <Button className="flex items-center gap-2" asChild>
                <a href={flowchartPdf} download="kenya-eprocurement-flowchart.pdf">
                  <FileDown className="h-4 w-4" />
                  Download Flowchart PDF
                </a>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to="/flowchart">
                  View Interactive Flowchart
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>Key components and processes of the Kenya e-Procurement System</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Tender Management</h3>
              <p>
                The system allows government agencies to publish tenders, manage the bidding process, 
                and track the entire procurement lifecycle from publication to completion. Tenders are 
                categorized by sector, status, and value for easy navigation and management.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Supplier Directory</h3>
              <p>
                A comprehensive database of pre-qualified suppliers, categorized by industry, 
                certification level, and past performance. This allows government agencies to 
                quickly identify suitable suppliers for their procurement needs.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
              <p>
                Real-time analytics on procurement activities, including total spending, 
                distribution across sectors, and contract status. This provides transparency 
                and helps in making data-driven decisions for future procurement planning.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Bid Submission & Evaluation</h3>
              <p>
                Suppliers can submit bids electronically, and evaluators use standardized 
                criteria to assess submissions. The evaluation process is transparent, with 
                clear scoring systems and automated compliance checks.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DocumentationPage;
