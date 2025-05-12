
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import TenderStatusBadge, { TenderStatus } from "./TenderStatusBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export interface TenderInfo {
  id: string;
  title: string;
  reference: string;
  issuingAuthority: string;
  closingDate: string;
  value: number;
  status: TenderStatus;
  sector: string;
}

interface TenderCardProps {
  tender: TenderInfo;
}

const TenderCard = ({ tender }: TenderCardProps) => {
  const formattedValue = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(tender.value);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{tender.reference}</p>
            <h3 className="font-semibold leading-tight text-lg">{tender.title}</h3>
          </div>
          <TenderStatusBadge status={tender.status} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow py-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-muted-foreground">Issuing Authority</p>
            <p className="font-medium">{tender.issuingAuthority}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sector</p>
            <p className="font-medium">{tender.sector}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Closing Date</p>
            <p className="font-medium">{tender.closingDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Estimated Value</p>
            <p className="font-medium">{formattedValue}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Button variant="outline" asChild className="w-full">
          <Link to={`/tenders/${tender.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TenderCard;
