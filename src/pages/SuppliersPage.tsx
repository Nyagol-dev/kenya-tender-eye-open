
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Supplier {
  id: string;
  name: string;
  category: string;
  location: string;
  registrationNumber: string;
  status: "active" | "suspended" | "blacklisted";
  completedContracts: number;
}

const suppliers: Supplier[] = [
  {
    id: "SUP-001",
    name: "Simba Construction Ltd",
    category: "Construction",
    location: "Nairobi",
    registrationNumber: "C82726354",
    status: "active",
    completedContracts: 15,
  },
  {
    id: "SUP-002",
    name: "TechEast Solutions",
    category: "ICT",
    location: "Mombasa",
    registrationNumber: "C73625142",
    status: "active",
    completedContracts: 8,
  },
  {
    id: "SUP-003",
    name: "MediKenya Supplies",
    category: "Healthcare",
    location: "Kisumu",
    registrationNumber: "C65432198",
    status: "active",
    completedContracts: 12,
  },
  {
    id: "SUP-004",
    name: "EduTrainers Kenya",
    category: "Education",
    location: "Nakuru",
    registrationNumber: "C91827364",
    status: "active",
    completedContracts: 6,
  },
  {
    id: "SUP-005",
    name: "AgriTech Solutions Ltd",
    category: "Agriculture",
    location: "Eldoret",
    registrationNumber: "C45678912",
    status: "active",
    completedContracts: 9,
  },
  {
    id: "SUP-006",
    name: "Secure Systems Inc.",
    category: "Security",
    location: "Nairobi",
    registrationNumber: "C12345678",
    status: "active",
    completedContracts: 7,
  },
  {
    id: "SUP-007",
    name: "FastTrack Development",
    category: "Construction",
    location: "Nairobi",
    registrationNumber: "C23456789",
    status: "blacklisted",
    completedContracts: 3,
  },
  {
    id: "SUP-008",
    name: "WaterWorks Engineering",
    category: "Infrastructure",
    location: "Mombasa",
    registrationNumber: "C34567891",
    status: "active",
    completedContracts: 11,
  },
  {
    id: "SUP-009",
    name: "Digital Systems Ltd",
    category: "ICT",
    location: "Nairobi",
    registrationNumber: "C56789123",
    status: "suspended",
    completedContracts: 4,
  }
];

const SuppliersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        supplier.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "" || supplier.category === category;
    const matchesStatus = status === "" || supplier.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(suppliers.map(s => s.category)));

  const getStatusBadge = (status: "active" | "suspended" | "blacklisted") => {
    const statusConfig = {
      "active": {
        label: "Active",
        className: "bg-kenya-green text-white"
      },
      "suspended": {
        label: "Suspended",
        className: "bg-yellow-600 text-white"
      },
      "blacklisted": {
        label: "Blacklisted",
        className: "bg-kenya-red text-white"
      }
    };

    const config = statusConfig[status];

    return (
      <Badge className={config.className}>{config.label}</Badge>
    );
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Supplier Directory</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-grow">
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-[180px]">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredSuppliers.length > 0 ? (
          <div className="space-y-4">
            {filteredSuppliers.map(supplier => (
              <Card key={supplier.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold">{supplier.name}</h3>
                        {getStatusBadge(supplier.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">Reg. No: {supplier.registrationNumber}</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Category:</span> {supplier.category}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Location:</span> {supplier.location}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Completed contracts:</span> {supplier.completedContracts}
                      </div>
                    </div>
                    
                    <Button variant="outline" className="mt-4 md:mt-0 shrink-0">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">No suppliers found matching your criteria.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SuppliersPage;
