
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  return (
    <Card className="col-span-2">
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
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
            <Tooltip />
            <Bar dataKey="value" fill="#bb0000" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SectorDistribution;
