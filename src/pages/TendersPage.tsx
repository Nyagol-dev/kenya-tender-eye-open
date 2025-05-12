
import MainLayout from "@/components/layout/MainLayout";
import TenderList from "@/components/tenders/TenderList";
import { MOCK_TENDERS } from "@/mock/tenderData";

const TendersPage = () => {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Tenders</h1>
        <TenderList tenders={MOCK_TENDERS} />
      </div>
    </MainLayout>
  );
};

export default TendersPage;
