"use client";

import { useStore } from "@/lib/store";
import {
  Activity,
  Boxes,
  GitBranch,
  Zap,
  AlertTriangle,
  TrendingUp,
  Clock,
  Database,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardPage() {
  const { models, pipelines, batchJobs, metrics, abRoutes } = useStore();

  const totalRequests = metrics.reduce((a, m) => a + m.requests, 0);
  const avgLatency = Math.round(
    metrics.reduce((a, m) => a + m.avg_latency_ms, 0) / (metrics.length || 1)
  );
  const avgErrorRate =
    metrics.length > 0
      ? (metrics.reduce((a, m) => a + m.error_rate, 0) / metrics.length) * 100
      : 0;
  const avgCacheHit =
    metrics.length > 0
      ? (metrics.reduce((a, m) => a + m.cache_hit_rate, 0) / metrics.length) * 100
      : 0;

  const latestMetrics = metrics.slice(-24).map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    requests: m.requests,
    latency: m.avg_latency_ms,
    errors: Math.round(m.error_rate * 100 * 100) / 100,
  }));

  const modelUsage = models.slice(0, 5).map((model) => {
    const modelMetrics = metrics.filter((m) => m.model_id === model.id);
    return {
      name: model.name.length > 15 ? model.name.slice(0, 15) + "..." : model.name,
      requests: modelMetrics.reduce((a, m) => a + m.requests, 0),
      tokens: modelMetrics.reduce((a, m) => a + m.tokens_used, 0),
    };
  });

  const stats = [
    { label: "Active Models", value: models.filter((m) => m.status === "active").length, icon: Boxes, color: "text-brand-400" },
    { label: "Pipelines", value: pipelines.length, icon: GitBranch, color: "text-emerald-400" },
    { label: "Total Requests (24h)", value: totalRequests.toLocaleString(), icon: Activity, color: "text-blue-400" },
    { label: "Avg Latency", value: `${avgLatency}ms`, icon: Clock, color: "text-yellow-400" },
    { label: "Error Rate", value: `${avgErrorRate.toFixed(2)}%`, icon: AlertTriangle, color: "text-red-400" },
    { label: "Cache Hit Rate", value: `${avgCacheHit.toFixed(1)}%`, icon: Database, color: "text-purple-400" },
    { label: "Active A/B Tests", value: abRoutes.filter((r) => r.status === "active").length, icon: TrendingUp, color: "text-cyan-400" },
    { label: "Batch Jobs", value: batchJobs.filter((j) => j.status === "running").length + " running", icon: Zap, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Overview of your AI model serving platform</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg bg-gray-800 p-2 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Requests (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={latestMetrics}>
              <defs>
                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#colorReq)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Latency (ms)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={latestMetrics}>
              <defs>
                <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Area type="monotone" dataKey="latency" stroke="#f59e0b" fill="url(#colorLat)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Model Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={modelUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Bar dataKey="requests" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Recent Batch Jobs</h3>
          <div className="space-y-3">
            {batchJobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {models.find((m) => m.id === job.model_id)?.name || "Unknown Model"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {job.completed_requests}/{job.total_requests} completed
                  </p>
                </div>
                <span
                  className={
                    job.status === "completed"
                      ? "badge-green"
                      : job.status === "running"
                      ? "badge-blue"
                      : job.status === "failed"
                      ? "badge-red"
                      : "badge-yellow"
                  }
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
