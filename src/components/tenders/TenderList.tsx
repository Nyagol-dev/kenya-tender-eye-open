
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import TenderCard, { TenderInfo } from "./TenderCard";

interface TenderListProps {
  tenders: TenderInfo[];
}

const TenderList = ({ tenders }: TenderListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState("");
  
  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tender.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sector === "" || tender.sector === sector;
    const matchesStatus = status === "" || tender.status === status;
    return matchesSearch && matchesSector && matchesStatus;
  });

  // Get unique sectors for filter
  const sectors = Array.from(new Set(tenders.map(t => t.sector)));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow">
          <Input
            placeholder="Search tenders..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger>
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sectors</SelectItem>
              {sectors.map(sector => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[180px]">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="under-review">Under Review</SelectItem>
              <SelectItem value="awarded">Awarded</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredTenders.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredTenders.map(tender => (
            <TenderCard key={tender.id} tender={tender} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">No tenders found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default TenderList;
