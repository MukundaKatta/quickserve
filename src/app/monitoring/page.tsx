"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Activity, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

export default function MonitoringPage() {
  const { models, metrics } = useStore();
  const textModels = models.filter((m) => m.type === "text").slice(0, 4);
  const [selectedModelId, setSelectedModelId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24h");

  const filteredMetrics = selectedModelId === "all"
    ? metrics
    : metrics.filter((m) => m.model_id === selectedModelId);

  const chartData = filteredMetrics.slice(-24).map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    requests: m.requests,
    avg_latency: m.avg_latency_ms,
    p99_latency: m.p99_latency_ms,
    error_rate: Math.round(m.error_rate * 10000) / 100,
    tokens: m.tokens_used,
    cache_hit: Math.round(m.cache_hit_rate * 100),
  }));

  const totalReqs = filteredMetrics.reduce((a, m) => a + m.requests, 0);
  const avgLat = Math.round(filteredMetrics.reduce((a, m) => a + m.avg_latency_ms, 0) / (filteredMetrics.length || 1));
  const avgErr = filteredMetrics.length > 0 ? (filteredMetrics.reduce((a, m) => a + m.error_rate, 0) / filteredMetrics.length * 100) : 0;
  const totalTokens = filteredMetrics.reduce((a, m) => a + m.tokens_used, 0);

  const modelComparison = textModels.map((model) => {
    const mm = metrics.filter((m) => m.model_id === model.id);
    return {
      name: model.name.length > 12 ? model.name.slice(0, 12) + "..." : model.name,
      avg_latency: Math.round(mm.reduce((a, m) => a + m.avg_latency_ms, 0) / (mm.length || 1)),
      requests: mm.reduce((a, m) => a + m.requests, 0),
      error_rate: mm.length > 0 ? Math.round(mm.reduce((a, m) => a + m.error_rate, 0) / mm.length * 10000) / 100 : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoring</h1>
          <p className="text-gray-400">Real-time performance and health metrics</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)}>
            <option value="all">All Models</option>
            {textModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select className="input w-auto" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1h">Last 1h</option>
            <option value="6h">Last 6h</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7d</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Requests", value: totalReqs.toLocaleString(), icon: Activity, color: "text-brand-400" },
          { label: "Avg Latency", value: `${avgLat}ms`, icon: Clock, color: "text-yellow-400" },
          { label: "Error Rate", value: `${avgErr.toFixed(2)}%`, icon: AlertTriangle, color: avgErr > 5 ? "text-red-400" : "text-emerald-400" },
          { label: "Tokens Used", value: `${(totalTokens / 1000000).toFixed(1)}M`, icon: TrendingUp, color: "text-blue-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg bg-gray-800 p-2 ${s.color}`}><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-lg font-semibold text-white">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Request Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorReqMon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#colorReqMon)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Latency (avg vs p99)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="avg_latency" stroke="#6366f1" strokeWidth={2} dot={false} name="Avg" />
              <Line type="monotone" dataKey="p99_latency" stroke="#f59e0b" strokeWidth={2} dot={false} name="P99" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Error Rate (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorErr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
              <Area type="monotone" dataKey="error_rate" stroke="#ef4444" fill="url(#colorErr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Cache Hit Rate (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCache" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
              <Area type="monotone" dataKey="cache_hit" stroke="#10b981" fill="url(#colorCache)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-gray-300">Model Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="pb-3 text-left font-medium text-gray-500">Model</th>
                <th className="pb-3 text-left font-medium text-gray-500">Total Requests</th>
                <th className="pb-3 text-left font-medium text-gray-500">Avg Latency</th>
                <th className="pb-3 text-left font-medium text-gray-500">Error Rate</th>
                <th className="pb-3 text-left font-medium text-gray-500">Health</th>
              </tr>
            </thead>
            <tbody>
              {modelComparison.map((mc) => (
                <tr key={mc.name} className="border-b border-gray-800/50">
                  <td className="py-3 font-medium text-white">{mc.name}</td>
                  <td className="py-3 text-gray-300">{mc.requests.toLocaleString()}</td>
                  <td className="py-3 text-gray-300">{mc.avg_latency}ms</td>
                  <td className="py-3 text-gray-300">{mc.error_rate}%</td>
                  <td className="py-3">
                    <span className={mc.error_rate < 2 ? "badge-green" : mc.error_rate < 5 ? "badge-yellow" : "badge-red"}>
                      {mc.error_rate < 2 ? "Healthy" : mc.error_rate < 5 ? "Warning" : "Critical"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
