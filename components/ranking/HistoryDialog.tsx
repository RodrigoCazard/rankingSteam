"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Participant } from "./types";
import { MONTH_NAMES, getTrophyIcon } from "./constants";

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
}

export function HistoryDialog({ open, onOpenChange, participants }: HistoryDialogProps) {
  const months = useMemo(() => {
    const map = new Map<
      string,
      { year: number; month: number; positions: Map<number, { name: string; total: number }> }
    >();

    for (const p of participants) {
      for (const t of p.trophies) {
        const key = `${t.year}-${String(t.month).padStart(2, "0")}`;
        if (!map.has(key)) {
          map.set(key, { year: t.year, month: t.month, positions: new Map() });
        }
        map.get(key)!.positions.set(t.position, { name: p.name, total: t.total_spent });
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [participants]);

  const chartData = months.map((m) => ({
    label: `${MONTH_NAMES[m.month - 1].slice(0, 3)} ${String(m.year).slice(2)}`,
    ganador: m.positions.get(1)?.total ?? 0,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 w-[94vw] max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white text-base font-bold">
            Historial de temporadas
          </DialogTitle>
        </DialogHeader>

        {months.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">
            Aún no hay temporadas cerradas
          </p>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-5 pr-1">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3 font-semibold">
                Gasto del ganador por temporada
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                    width={46}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#12122a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                    itemStyle={{ color: "#facc15", fontSize: 12 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Ganador"]}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="ganador" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === chartData.length - 1
                            ? "#facc15"
                            : "rgba(250,204,21,0.3)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {[...months].reverse().map((m) => (
                <div
                  key={`${m.year}-${m.month}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">
                    {MONTH_NAMES[m.month - 1]} {m.year}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 5].map((pos) => {
                      const entry = m.positions.get(pos);
                      if (!entry) return null;
                      return (
                        <div
                          key={pos}
                          className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1"
                        >
                          {getTrophyIcon(pos)}
                          <span className="text-white text-xs font-semibold">
                            {entry.name}
                          </span>
                          <span className="text-white/40 text-xs">
                            ${entry.total.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
