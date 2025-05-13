
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import flowchartPdf from "/flowchart.pdf";
import systemFlowchart from "/system-flowchart.png";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DocumentationPage = () => {
  return (
    <MainLayout>
      <div className="container py-8 space-y-8">
        <section className="text-center py-12 bg-gradient-to-r from-kenya-green/10 to-kenya-red/10 rounded-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">System Documentation & Terms</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Understanding the Kenya e-Procurement System workflow, architecture, and terms of use
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
            
            <Button className="flex items-center gap-2" asChild>
              <a href={flowchartPdf} download="kenya-eprocurement-flowchart.pdf">
                <FileDown className="h-4 w-4" />
                Download Flowchart PDF
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-8">
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

        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
            <CardDescription>Guidelines and policies for using the Kenya e-Procurement System</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>User Registration and Access</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Users must register with accurate information to access the system.</li>
                    <li>Government agencies must verify their identity through official channels.</li>
                    <li>Suppliers must provide business registration documents and tax compliance certificates.</li>
                    <li>Account credentials are strictly confidential and should not be shared.</li>
                    <li>Users are responsible for all activities performed under their account.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>Tender Submission Rules</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All submissions must be made through the official e-Procurement platform.</li>
                    <li>Documents must be submitted in the required format (PDF, Excel, etc.) as specified in the tender.</li>
                    <li>Late submissions will not be accepted; the system automatically closes at the deadline.</li>
                    <li>Users are responsible for ensuring adequate time for document uploads.</li>
                    <li>Technical issues should be reported at least 24 hours before deadline for assistance.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>Data Privacy and Security</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All data submitted is subject to the Kenya Data Protection Act.</li>
                    <li>Information provided will only be used for procurement purposes.</li>
                    <li>Bid information remains confidential until the official opening date.</li>
                    <li>The system employs encryption and security protocols to protect user data.</li>
                    <li>Users consent to data analysis for system improvement and audit purposes.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>System Usage Policies</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Attempting to compromise system security is strictly prohibited.</li>
                    <li>Users must not attempt to access unauthorized information.</li>
                    <li>The platform should not be used for purposes other than intended.</li>
                    <li>System maintenance windows will be communicated in advance.</li>
                    <li>The government reserves the right to modify system features with notice.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>Legal Framework</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The system operates under the Public Procurement and Asset Disposal Act.</li>
                    <li>All transactions are subject to relevant Kenyan laws and regulations.</li>
                    <li>Disputes will be resolved according to the established procurement appeal process.</li>
                    <li>Electronic submissions have the same legal standing as physical documents.</li>
                    <li>System timestamps are considered official for all deadline purposes.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DocumentationPage;
