"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGameStore } from "@/store/gameStore";

/**
 * StockChart 컴포넌트
 * - 역할: 주가 추이를 꺾은선 그래프로 시각화
 */
export default function StockChart() {
  const stockHistory = useGameStore((s) => s.stockHistory);

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4">
      <h3 className="text-sm font-bold text-foreground/60 mb-3">주가 추이</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stockHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="turn"
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v) => `${v}턴`}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(v) => `${v}턴`}
              formatter={(value) => [
                `${Number(value).toLocaleString()}원`,
                "주가",
              ]}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#06b6d4" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
