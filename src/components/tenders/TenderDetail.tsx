
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TenderInfo } from "./TenderCard";
import TenderStatusBadge from "./TenderStatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

interface TenderDetailProps {
  tender: TenderInfo;
}

const TenderDetail = ({ tender }: TenderDetailProps) => {
  const formattedValue = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(tender.value);

  // Mock timeline events
  const timelineEvents: TimelineEvent[] = [
    {
      date: "2023-04-10",
      title: "Tender Published",
      description: "Tender published on e-Procurement portal."
    },
    {
      date: "2023-04-15",
      title: "Clarification Meeting",
      description: "Pre-bid clarification meeting held at City Hall, Nairobi."
    },
    {
      date: "2023-04-25",
      title: "Addendum Released",
      description: "Addendum #1 released with specification updates."
    },
    {
      date: "2023-05-10",
      title: "Tender Closed",
      description: "Bidding period closed. 8 bids received."
    }
  ];

  // For awarded tenders, add award event
  if (tender.status === "awarded" || tender.status === "completed") {
    timelineEvents.push({
      date: "2023-05-25",
      title: "Contract Awarded",
      description: "Contract awarded to Simba Construction Ltd."
    });
  }

  // For completed tenders, add completion event
  if (tender.status === "completed") {
    timelineEvents.push({
      date: "2023-09-15",
      title: "Project Completed",
      description: "Project successfully completed and verified."
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{tender.title}</h1>
            <TenderStatusBadge status={tender.status} className="mt-1" />
          </div>
          <p className="text-muted-foreground">Reference: {tender.reference}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/tenders">Back to Tenders</Link>
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Tender Details</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Issuing Authority</h3>
                <p>{tender.issuingAuthority}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Sector</h3>
                <p>{tender.sector}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Publication Date</h3>
                <p>April 10, 2023</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Closing Date</h3>
                <p>{tender.closingDate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Estimated Value</h3>
                <p>{formattedValue}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Location</h3>
                <p>Nairobi County</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                This tender involves the procurement of construction services for the expansion of 
                key infrastructure in line with the Kenya Vision 2030 goals. The project aims to 
                enhance transportation networks and improve accessibility within major urban centers.
              </p>
              <p className="mt-4">
                The scope includes construction of new roads, rehabilitation of existing infrastructure, 
                and installation of modern traffic management systems to reduce congestion and improve 
                safety standards across the targeted regions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Technical Requirements</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Minimum 10 years experience in similar infrastructure projects</li>
                  <li>Proven track record of at least 3 similar projects completed in the last 5 years</li>
                  <li>Quality management certifications (ISO 9001)</li>
                  <li>Environmental management system in place (ISO 14001)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Financial Requirements</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Annual turnover of at least KES 500 million for the last 3 years</li>
                  <li>Proof of financial stability and access to credit facilities</li>
                  <li>Tax compliance certificate</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {tender.status === "awarded" && (
            <Card>
              <CardHeader>
                <CardTitle>Award Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Awarded To</h3>
                    <p>Simba Construction Ltd.</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Award Date</h3>
                    <p>May 25, 2023</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Contract Value</h3>
                    <p>KES 285,000,000</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Contract Duration</h3>
                    <p>18 months</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Tender Timeline</CardTitle>
              <CardDescription>Track the progress of this tender from publication to completion</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l border-gray-200 ml-3">
                {timelineEvents.map((event, index) => (
                  <li key={index} className="mb-10 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-kenya-green rounded-full -left-3 ring-8 ring-white">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </span>
                    <h3 className="flex items-center mb-1 text-lg font-semibold">
                      {event.title}
                    </h3>
                    <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                      {new Date(event.date).toLocaleDateString('en-KE', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </time>
                    <p className="text-base font-normal">
                      {event.description}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Tender Documents</CardTitle>
              <CardDescription>All official documents related to this tender</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="space-y-1">
                    <p className="font-medium">Tender Notice</p>
                    <p className="text-sm text-muted-foreground">PDF • 2.4 MB • Uploaded April 10, 2023</p>
                  </div>
                  <Button variant="outline">Download</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="space-y-1">
                    <p className="font-medium">Technical Specifications</p>
                    <p className="text-sm text-muted-foreground">PDF • 18.7 MB • Uploaded April 10, 2023</p>
                  </div>
                  <Button variant="outline">Download</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="space-y-1">
                    <p className="font-medium">Bill of Quantities</p>
                    <p className="text-sm text-muted-foreground">XLSX • 4.1 MB • Uploaded April 10, 2023</p>
                  </div>
                  <Button variant="outline">Download</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="space-y-1">
                    <p className="font-medium">Addendum #1</p>
                    <p className="text-sm text-muted-foreground">PDF • 1.2 MB • Uploaded April 25, 2023</p>
                  </div>
                  <Button variant="outline">Download</Button>
                </div>

                {tender.status === "awarded" && (
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div className="space-y-1">
                      <p className="font-medium">Award Notice</p>
                      <p className="text-sm text-muted-foreground">PDF • 0.8 MB • Uploaded May 26, 2023</p>
                    </div>
                    <Button variant="outline">Download</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenderDetail;
