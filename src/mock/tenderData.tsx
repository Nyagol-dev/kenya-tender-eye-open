
import { TenderInfo } from "@/components/tenders/TenderCard";
import { TenderStatus } from "@/components/tenders/TenderStatusBadge";

export const MOCK_TENDERS: TenderInfo[] = [
  {
    id: "KE-MOI-2023-001",
    title: "Supply and Installation of Traffic Management System in Nairobi CBD",
    reference: "KE-MOI-2023-001",
    issuingAuthority: "Ministry of Infrastructure",
    closingDate: "May 10, 2023",
    value: 320000000,
    status: "awarded" as TenderStatus,
    sector: "Infrastructure"
  },
  {
    id: "KE-MOH-2023-045",
    title: "Construction of County Referral Hospital in Machakos",
    reference: "KE-MOH-2023-045",
    issuingAuthority: "Ministry of Health",
    closingDate: "June 15, 2023",
    value: 450000000,
    status: "under-review" as TenderStatus,
    sector: "Healthcare"
  },
  {
    id: "KE-MOE-2023-078",
    title: "Supply of Educational Materials for Primary Schools",
    reference: "KE-MOE-2023-078",
    issuingAuthority: "Ministry of Education",
    closingDate: "May 5, 2023",
    value: 120000000,
    status: "completed" as TenderStatus,
    sector: "Education"
  },
  {
    id: "KE-MOICT-2023-034",
    title: "National Data Center Expansion Project",
    reference: "KE-MOICT-2023-034",
    issuingAuthority: "Ministry of ICT",
    closingDate: "July 20, 2023",
    value: 280000000,
    status: "open" as TenderStatus,
    sector: "ICT"
  },
  {
    id: "KE-MOA-2023-056",
    title: "Irrigation System Development in Arid Areas",
    reference: "KE-MOA-2023-056",
    issuingAuthority: "Ministry of Agriculture",
    closingDate: "June 25, 2023",
    value: 180000000,
    status: "open" as TenderStatus,
    sector: "Agriculture"
  },
  {
    id: "KE-MOD-2023-012",
    title: "Supply of Security Equipment for Border Control",
    reference: "KE-MOD-2023-012",
    issuingAuthority: "Ministry of Defense",
    closingDate: "May 30, 2023",
    value: 350000000,
    status: "under-review" as TenderStatus,
    sector: "Security"
  },
  {
    id: "KE-MOW-2023-089",
    title: "Water Supply and Sanitation Project in Nakuru",
    reference: "KE-MOW-2023-089",
    issuingAuthority: "Ministry of Water",
    closingDate: "July 15, 2023",
    value: 220000000,
    status: "open" as TenderStatus,
    sector: "Infrastructure"
  },
  {
    id: "KE-MOE-2023-103",
    title: "Construction of Technical Training Institutes",
    reference: "KE-MOE-2023-103",
    issuingAuthority: "Ministry of Education",
    closingDate: "August 5, 2023",
    value: 380000000,
    status: "open" as TenderStatus,
    sector: "Education"
  },
  {
    id: "KE-MOH-2023-067",
    title: "Supply of Medical Equipment for County Hospitals",
    reference: "KE-MOH-2023-067",
    issuingAuthority: "Ministry of Health",
    closingDate: "June 10, 2023",
    value: 290000000,
    status: "cancelled" as TenderStatus,
    sector: "Healthcare"
  },
  {
    id: "KE-MOT-2023-023",
    title: "Road Construction Project: Nairobi-Nakuru Highway Expansion",
    reference: "KE-MOT-2023-023",
    issuingAuthority: "Ministry of Transport",
    closingDate: "July 30, 2023",
    value: 520000000,
    status: "awarded" as TenderStatus,
    sector: "Infrastructure"
  },
  {
    id: "KE-MOICT-2023-048",
    title: "Last Mile Connectivity Project - Fiber Optic Installation",
    reference: "KE-MOICT-2023-048",
    issuingAuthority: "Ministry of ICT",
    closingDate: "August 15, 2023",
    value: 180000000,
    status: "open" as TenderStatus,
    sector: "ICT"
  },
  {
    id: "KE-MOA-2023-071",
    title: "Agricultural Machinery Supply for Smallholder Farmers",
    reference: "KE-MOA-2023-071",
    issuingAuthority: "Ministry of Agriculture",
    closingDate: "July 5, 2023",
    value: 150000000,
    status: "under-review" as TenderStatus,
    sector: "Agriculture"
  }
];

export function getTenderById(id: string): TenderInfo | undefined {
  return MOCK_TENDERS.find(tender => tender.id === id);
}
