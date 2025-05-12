
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import TenderDetail from "@/components/tenders/TenderDetail";
import { getTenderById } from "@/mock/tenderData";
import { useEffect } from "react";

const TenderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tender = id ? getTenderById(id) : undefined;
  
  useEffect(() => {
    if (!tender) {
      navigate("/tenders", { replace: true });
    }
  }, [tender, navigate]);
  
  if (!tender) {
    return null;
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
