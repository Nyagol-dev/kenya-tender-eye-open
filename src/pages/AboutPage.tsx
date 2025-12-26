
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AboutPage = () => {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">About the System</h1>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vision">Vision & Mission</TabsTrigger>
            <TabsTrigger value="process">Procurement Process</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Kenya e-Procurement System</CardTitle>
                <CardDescription>Transparent, efficient, and accountable public procurement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                 The Kenya e-Procurement System is a digital platform designed to streamline the entire government procurement process, 
                 from tender publication to contract award and implementation. The system promotes transparency, reduces procurement 
                  costs, and enhances efficiency in public spending.
                </p>
                
                <p>
                  Launched as part of Kenya's commitment to open governance and digital transformation, this platform serves as a 
                  one-stop shop for all public procurement information, allowing citizens, suppliers, and oversight bodies to 
                  access real-time data on government tenders and contracts.
                </p>
                
                <h3 className="text-lg font-semibold mt-6">Key Benefits</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Enhanced transparency and accountability in public spending</li>
                  <li>Reduced procurement costs through digitization and efficiency</li>
                  <li>Increased competition and equal access to government opportunities</li>
                  <li>Streamlined processes for both procuring entities and suppliers</li>
                  <li>Better monitoring and evaluation of procurement activities</li>
                  <li>Reduced corruption through open access to procurement information</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vision">
            <Card>
              <CardHeader>
                <CardTitle>Vision & Mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Vision</h3>
                  <div className="bg-kenya-green/10 p-4 rounded-md">
                    <p className="italic">
                      "To be the leading public procurement system in Africa, characterized by transparency,
                      efficiency, and integrity in service delivery."
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Mission</h3>
                  <div className="bg-kenya-red/10 p-4 rounded-md">
                    <p className="italic">
                      "To transform public procurement in Kenya through digitization, ensuring value for money,
                      promoting fair competition, and enhancing accountability in the use of public resources."
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Core Values</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium">Transparency</h4>
                      <p className="text-sm text-muted-foreground">
                        Open access to procurement information for all stakeholders
                      </p>
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium">Integrity</h4>
                      <p className="text-sm text-muted-foreground">
                        Upholding ethical standards and professionalism in all processes
                      </p>
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium">Efficiency</h4>
                      <p className="text-sm text-muted-foreground">
                        Optimizing resources and processes to deliver timely results
                      </p>
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium">Innovation</h4>
                      <p className="text-sm text-muted-foreground">
                        Embracing new technologies and approaches to improve service delivery
                      </p>
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium">Fairness</h4>
                      <p className="text-sm text-muted-foreground">
                        Equal opportunity for all qualified suppliers to compete for tenders
                      </p>
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium">Accountability</h4>
                      <p className="text-sm text-muted-foreground">
                        Taking responsibility for decisions and actions in procurement
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="process">
            <Card>
              <CardHeader>
                <CardTitle>Procurement Process</CardTitle>
                <CardDescription>Understanding how government tenders work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="relative">
                    <div className="absolute left-4 top-5 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-12">
                      <div className="relative pl-10">
                        <div className="flex items-center absolute -left-1">
                          <div className="bg-kenya-green text-white rounded-full w-8 h-8 flex items-center justify-center">1</div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Needs Identification</h3>
                        <p>
                          Government departments identify procurement needs based on their strategic plans and budget allocations. 
                          The procurement unit validates the requirements and confirms budget availability.
                        </p>
                      </div>
                      
                      <div className="relative pl-10">
                        <div className="flex items-center absolute -left-1">
                          <div className="bg-kenya-green text-white rounded-full w-8 h-8 flex items-center justify-center">2</div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Procurement Planning</h3>
                        <p>
                          Preparation of procurement plans including specifications, estimated costs, and procurement method selection.
                          All plans are uploaded to the e-Procurement system for transparency.
                        </p>
                      </div>
                      
                      <div className="relative pl-10">
                        <div className="flex items-center absolute -left-1">
                          <div className="bg-kenya-green text-white rounded-full w-8 h-8 flex items-center justify-center">3</div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Tender Publication</h3>
                        <p>
                          Tenders are published on the e-Procurement portal with clear requirements, timelines, and evaluation criteria.
                          All registered suppliers receive notifications for relevant opportunities.
                        </p>
                      </div>
                      
                      <div className="relative pl-10">
                        <div className="flex items-center absolute -left-1">
                          <div className="bg-kenya-green text-white rounded-full w-8 h-8 flex items-center justify-center">4</div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Bid Submission</h3>
                        <p>
                          Suppliers submit their bids electronically through the platform. The system ensures security and 
                          confidentiality of bid information until the submission deadline.
                        </p>
                      </div>
                      
                      <div className="relative pl-10">
                        <div className="flex items-center absolute -left-1">
                          <div className="bg-kenya-green text-white rounded-full w-8 h-8 flex items-center justify-center">5</div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Evaluation</h3>
                        <p>
                          Bids are evaluated based on predetermined criteria. The evaluation process is documented in the system 
                          to ensure transparency and accountability.
                        </p>
                      </div>
                      
                      <div className="relative pl-10">
                        <div className="flex items-center absolute -left-1">
                          <div className="bg-kenya-green text-white rounded-full w-8 h-8 flex items-center justify-center">6</div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Award and Contracting</h3>
                        <p>
                          The tender is awarded to the successful bidder. Award notices are published on the portal, and contracts 
                          are signed and uploaded to the system.
                        </p>
                      </div>
                      
                      <div className="relative pl-10">
                        <div className="flex items-center absolute -left-1">
                          <div className="bg-kenya-green text-white rounded-full w-8 h-8 flex items-center justify-center">7</div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Implementation and Monitoring</h3>
                        <p>
                          Contract implementation is monitored through the system. Payments, deliverables, and performance metrics 
                          are recorded for transparency and future reference.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Common questions about the e-Procurement system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">How do I register as a supplier?</h3>
                    <p>
                      Supplier registration is done through the Kenya National Treasury's IFMIS portal. You need to provide 
                      your company registration documents, tax compliance certificate, and other required documentation.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Are all government tenders available on this platform?</h3>
                    <p>
                      Yes, all public procurement opportunities from national and county governments are required to be published 
                      on this platform as per the Public Procurement and Asset Disposal Act, 2015.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">How can I track the status of a tender?</h3>
                    <p>
                      Each tender has a unique reference number. You can use this reference number to search for the tender on the 
                      platform and view its current status, from publication to award.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Is there a fee to access tender documents?</h3>
                    <p>
                      Some tenders may require a non-refundable fee to access the full tender documents. This will be clearly 
                      indicated in the tender notice, along with payment instructions.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">How are tender awards decided?</h3>
                    <p>
                      Tenders are awarded based on the evaluation criteria specified in the tender documents. This may include 
                      technical capacity, financial capability, and price considerations, among others.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Can I appeal a tender award decision?</h3>
                    <p>
                      Yes, unsuccessful bidders can lodge an appeal with the Public Procurement Administrative Review Board (PPARB) 
                      within the timeline specified in the procurement law.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AboutPage;
