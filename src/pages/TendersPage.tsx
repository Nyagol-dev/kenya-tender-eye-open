import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TenderList from "@/components/tenders/TenderList";
import { Skeleton } from "@/components/ui/skeleton";
import { getTenders } from "@/lib/api";
import { TenderInfo } from "@/components/tenders/TenderCard";
import { useToast } from "@/hooks/use-toast";

const TendersPage = () => {
  const [tenders, setTenders] = useState<TenderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const res = await getTenders();
        setTenders(res.data);
      } catch (err: any) {
        toast({
          title: "Error fetching tenders",
          description: err.message || "Failed to load tenders",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, [toast]);

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Tenders</h1>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ) : (
          <TenderList tenders={tenders} />
        )}
      </div>
    </MainLayout>
  );
};

export default TendersPage;
