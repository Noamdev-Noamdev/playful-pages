import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DeviceChartProps {
  data: Array<{ name: string; visitors: number; percentage: number }>;
  loading?: boolean;
  colorMap?: Record<string, string>;
}

const defaultColors = [
  "oklch(0.88 0.12 20)", // pink
  "oklch(0.92 0.14 95)", // yellow
  "oklch(0.88 0.1 165)", // mint
  "oklch(0.86 0.1 230)", // sky
  "oklch(0.85 0.1 300)", // lilac
  "oklch(0.88 0.11 50)", // peach
  "oklch(0.9 0.14 130)", // lime
];

export function DeviceChart({ data, loading, colorMap = {} }: DeviceChartProps) {
  const safeData = Array.isArray(data) ? data : [];

  if (loading) {
    return (
      <div className="w-full h-[400px] border-2 border-foreground rounded-2xl p-6 shadow-[4px_4px_0_0_var(--foreground)] bg-background flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-full flex items-center gap-4 animate-pulse">
            <div className="w-20 h-4 bg-foreground/10 rounded"></div>
            <div className="h-8 bg-foreground/10 rounded-full flex-1"></div>
          </div>
        ))}
      </div>
    );
  }

  if (safeData.length === 0) {
    return (
      <div className="w-full h-[400px] border-2 border-foreground rounded-2xl shadow-[4px_4px_0_0_var(--foreground)] bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-medium text-lg">No data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const rowData = payload[0].payload;
      return (
        <div className="bg-background border-2 border-foreground p-3 rounded-xl shadow-[4px_4px_0_0_var(--foreground)] font-medium">
          <p className="text-sm font-bold mb-1">{rowData?.name || "Unknown"}</p>
          <p className="text-sm">Visitors: {(rowData?.visitors || 0).toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{rowData?.percentage || 0}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] border-2 border-foreground rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0_0_var(--foreground)] bg-background">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={safeData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 14, fontWeight: 600 }}
            width={100}
          />
          <Tooltip
            cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
            content={<CustomTooltip />}
          />
          <Bar
            dataKey="visitors"
            radius={[0, 16, 16, 0]}
            barSize={32}
            label={{
              position: "right",
              formatter: (val: any, entry: any) => {
                const count = Number(val) || 0;
                const pct = entry?.payload?.percentage ?? 0;
                return `${count.toLocaleString()} (${pct}%)`;
              },
              fill: "currentColor",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {safeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colorMap[entry?.name] || defaultColors[index % defaultColors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
