
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  Legend, TooltipProps 
} from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const tenderData = [
  { month: "Jan", tenders: 65, value: 120 },
  { month: "Feb", tenders: 59, value: 110 },
  { month: "Mar", tenders: 80, value: 150 },
  { month: "Apr", tenders: 81, value: 160 },
  { month: "May", tenders: 56, value: 90 },
  { month: "Jun", tenders: 55, value: 100 },
  { month: "Jul", tenders: 40, value: 80 },
];

type ChartView = "tenders" | "value";

const TenderChart = () => {
  const [view, setView] = useState<ChartView>("tenders");
  
  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tender Activity</CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant={view === "tenders" ? "default" : "outline"} 
            size="sm"
            onClick={() => setView("tenders")}
          >
            Count
          </Button>
          <Button 
            variant={view === "value" ? "default" : "outline"} 
            size="sm"
            onClick={() => setView("value")}
          >
            Value (M KSh)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {view === "tenders" ? (
            <BarChart data={tenderData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="tenders" fill="#006600" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={tenderData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#bb0000"
                fill="#bb000020"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TenderChart;
