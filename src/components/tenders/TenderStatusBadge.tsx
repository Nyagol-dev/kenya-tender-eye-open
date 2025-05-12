
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TenderStatus = 
  | "open" 
  | "under-review" 
  | "awarded" 
  | "completed" 
  | "cancelled";

interface TenderStatusBadgeProps {
  status: TenderStatus;
  className?: string;
}

const TenderStatusBadge = ({ status, className }: TenderStatusBadgeProps) => {
  const statusConfig = {
    "open": {
      label: "Open",
      variant: "outline" as const,
      className: "border-kenya-green text-kenya-green"
    },
    "under-review": {
      label: "Under Review",
      variant: "outline" as const,
      className: "border-yellow-600 text-yellow-600" 
    },
    "awarded": {
      label: "Awarded",
      variant: "outline" as const,
      className: "border-kenya-red text-kenya-red"
    },
    "completed": {
      label: "Completed",
      variant: "outline" as const,
      className: "border-kenya-black text-kenya-black"
    },
    "cancelled": {
      label: "Cancelled",
      variant: "outline" as const,
      className: "border-gray-500 text-gray-500"
    }
  };

  const config = statusConfig[status];

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};

export default TenderStatusBadge;
