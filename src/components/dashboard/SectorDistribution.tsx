
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState } from 'react';

const data = [
  {
    name: 'Infrastructure',
    value: 120,
  },
  {
    name: 'Healthcare',
    value: 80,
  },
  {
    name: 'Education',
    value: 70,
  },
  {
    name: 'Agriculture',
    value: 60,
  },
  {
    name: 'ICT',
    value: 40,
  },
  {
    name: 'Security',
    value: 30,
  },
];

const SectorDistribution = () => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const onBarEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onBarLeave = () => {
    setActiveIndex(-1);
  };

  return (
    <Card className="col-span-full md:col-span-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1">
      <CardHeader>
        <CardTitle>Tender Distribution by Sector</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 50,
              bottom: 5,
            }}
            onMouseEnter={onBarEnter}
            onMouseLeave={onBarLeave}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} interval={0} />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
            />
            <Bar 
              dataKey="value" 
              barSize={20}
              animationDuration={1000}
              animationBegin={0}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={activeIndex === index ? "#990000" : "#bb0000"}
                  style={{
                    transition: "all 0.3s ease-in-out"
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SectorDistribution;
