"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { type MeasurementWithStatus } from "@/lib/supabase/measurements";

interface MeasurementChartProps {
  measurements: MeasurementWithStatus[];
  metric: "HDL" | "LDL" | "TRIGLYCERIDES";
  title: string;
}

export function MeasurementChart({ measurements, metric, title }: MeasurementChartProps) {
  const filteredData = measurements
    .filter((m) => m.metric === metric)
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .map((m) => ({
      date: new Date(m.measured_at).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
      value: m.value,
      status: m.status,
    }));

  if (filteredData.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 bg-surface p-6 text-center">
        <p className="text-sm text-muted">No hay mediciones de {title} registradas aún.</p>
      </div>
    );
  }

  const getLineColor = (metric: string) => {
    switch (metric) {
      case "HDL":
        return "#15803d";
      case "LDL":
        return "#b42318";
      case "TRIGLYCERIDES":
        return "#d97706";
      default:
        return "#0f766e";
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-surface p-6">
      <h3 className="mb-4 text-base font-semibold text-ink">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#5f687c"
            style={{ fontSize: "12px" }}
          />
          <YAxis 
            stroke="#5f687c"
            style={{ fontSize: "12px" }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "#fffaf2",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
            }}
            formatter={(value) => `${value} mg/dL`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={getLineColor(metric)}
            strokeWidth={2}
            dot={{ fill: getLineColor(metric), r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
