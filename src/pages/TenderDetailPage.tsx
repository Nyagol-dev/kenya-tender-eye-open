import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import TenderDetail from "@/components/tenders/TenderDetail";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TenderInfo } from "@/components/tenders/TenderCard";

const TenderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tender, setTender] = useState<TenderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate("/tenders", { replace: true });
      return;
    }

    let cancelled = false;

    const fetchTender = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<TenderInfo>(`/tenders/${id}`);
        if (!cancelled) setTender(data);
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Tender not found.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTender();
    return () => { cancelled = true; };
  }, [id, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8 flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !tender) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Tender Not Found</h2>
          <p className="text-muted-foreground mb-4">{error ?? "The requested tender does not exist."}</p>
          <button
            className="text-primary underline"
            onClick={() => navigate("/tenders", { replace: true })}
          >
            Back to Tenders
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <TenderDetail tender={tender} />
      </div>
    </MainLayout>
  );
};

export default TenderDetailPage;
