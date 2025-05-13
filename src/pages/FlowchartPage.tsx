
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import flowchartPdf from "/flowchart.pdf";

const FlowchartPage = () => {
  return (
    <MainLayout>
      <div className="container py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">System Flowchart</h1>
          <p className="text-lg text-muted-foreground">
            The complete e-Procurement system workflow visual representation
          </p>
        </div>
        
        <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-md border">
          <div className="w-full aspect-[3/4] bg-muted rounded-lg mb-6 flex items-center justify-center">
            <iframe 
              src={flowchartPdf} 
              className="w-full h-full rounded-lg"
              title="Kenya e-Procurement System Flowchart"
            />
          </div>
          
          <Button className="flex items-center gap-2" size="lg" asChild>
            <a href={flowchartPdf} download="kenya-eprocurement-flowchart.pdf">
              <FileDown className="h-4 w-4" />
              Download Flowchart PDF
            </a>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default FlowchartPage;
