
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TenderInfo } from "./TenderCard";
import TenderStatusBadge from "./TenderStatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BidSubmitModal } from "@/components/tenders/BidSubmitModal";

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

interface TenderDetailProps {
  tender: TenderInfo;
}

const TenderDetail = ({ tender }: TenderDetailProps) => {
  const { profile, onboardingStatus, user } = useAuth();
  const navigate = useNavigate();
  const [bidModalOpen, setBidModalOpen] = useState(false);

  const formattedValue = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(tender.value);

  const handleBidClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setBidModalOpen(true);
  };

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

  if (tender.status === "awarded" || tender.status === "completed") {
    timelineEvents.push({
      date: "2023-05-25",
      title: "Contract Awarded",
      description: "Contract awarded to Simba Construction Ltd."
    });
  }

  if (tender.status === "completed") {
    timelineEvents.push({
      date: "2023-09-15",
      title: "Project Completed",
      description: "Project successfully completed and verified."
    });
  }

  const canBid = tender.status === "open";

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
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link to="/tenders">Back to Tenders</Link>
          </Button>
          {canBid && (
            <Button onClick={handleBidClick}>
              Submit Bid
            </Button>
          )}
        </div>
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
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Closing Date</h3>
                <p>{tender.closingDate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Estimated Value</h3>
                <p>{formattedValue}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {tender.description ? (
                <p className="whitespace-pre-line">{tender.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No detailed description provided for this tender.</p>
              )}
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
                {[
                  { name: "Tender Notice", size: "2.4 MB", date: "April 10, 2023" },
                  { name: "Technical Specifications", size: "18.7 MB", date: "April 10, 2023" },
                  { name: "Bill of Quantities", size: "4.1 MB", date: "April 10, 2023" },
                  { name: "Addendum #1", size: "1.2 MB", date: "April 25, 2023" },
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-4 border rounded-md">
                    <div className="space-y-1">
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">PDF • {doc.size} • Uploaded {doc.date}</p>
                    </div>
                    <Button variant="outline">Download</Button>
                  </div>
                ))}

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

      <BidSubmitModal
        open={bidModalOpen}
        onOpenChange={setBidModalOpen}
        tenderId={tender.id}
        tenderTitle={tender.title}
        tenderValue={tender.value}
      />
    </div>
  );
};

export default TenderDetail;
