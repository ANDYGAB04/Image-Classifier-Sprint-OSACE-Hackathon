import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ConfidenceChartProps {
  title: string;
  data: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  type?: "bar" | "pie";
}

export function ConfidenceChart({
  title,
  data,
  type = "bar",
}: ConfidenceChartProps) {
  // Transform data for recharts
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.values[index],
    fill: data.colors[index],
  }));

  if (type === "pie") {
    return (
      <div className="w-full h-full flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) =>
                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(139, 92, 246, 0.2)"
          />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: "#ccc", fontSize: 12 }}
          />
          <YAxis tick={{ fill: "#ccc" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(139, 92, 246, 0.5)",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ConfidenceChart;
