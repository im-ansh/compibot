import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RetentionData {
  score: number;
  screenshotCount: number;
  insights: string[];
}

interface UserRetentionChartProps {
  data: RetentionData;
}

const UserRetentionChart = ({ data }: UserRetentionChartProps) => {
  const chartData = [
    { name: "User Retention Score", value: data.score },
    { name: "Industry Average", value: 65 },
  ];

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">User Retention Analysis</h3>
        <p className="text-muted-foreground">
          Based on {data.screenshotCount} screenshot{data.screenshotCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-6xl font-bold text-primary">{data.score}</div>
          <div className="text-xl text-muted-foreground mt-2">/ 100</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="value" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        <h4 className="font-semibold">Key Insights:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {data.insights.map((insight, idx) => (
            <li key={idx}>{insight}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default UserRetentionChart;
