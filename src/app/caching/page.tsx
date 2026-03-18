"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Database, RefreshCw, Trash2, TrendingUp, Clock, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import toast from "react-hot-toast";

interface CacheEntry {
  id: string;
  prompt_hash: string;
  model_id: string;
  model_name: string;
  tokens_saved: number;
  hit_count: number;
  created_at: string;
  last_hit: string;
  ttl_seconds: number;
  size_bytes: number;
}

const SAMPLE_CACHE: CacheEntry[] = [
  { id: "1", prompt_hash: "a3f2b1c9", model_id: "m1", model_name: "GPT-4 Turbo", tokens_saved: 45230, hit_count: 342, created_at: new Date(Date.now() - 86400000).toISOString(), last_hit: new Date(Date.now() - 120000).toISOString(), ttl_seconds: 3600, size_bytes: 12400 },
  { id: "2", prompt_hash: "d7e8f9a0", model_id: "m2", model_name: "Claude 3.5 Sonnet", tokens_saved: 128900, hit_count: 891, created_at: new Date(Date.now() - 172800000).toISOString(), last_hit: new Date(Date.now() - 30000).toISOString(), ttl_seconds: 7200, size_bytes: 34200 },
  { id: "3", prompt_hash: "b4c5d6e7", model_id: "m3", model_name: "Mistral Large", tokens_saved: 23100, hit_count: 156, created_at: new Date(Date.now() - 43200000).toISOString(), last_hit: new Date(Date.now() - 600000).toISOString(), ttl_seconds: 1800, size_bytes: 8700 },
  { id: "4", prompt_hash: "f0a1b2c3", model_id: "m1", model_name: "GPT-4 Turbo", tokens_saved: 67800, hit_count: 523, created_at: new Date(Date.now() - 259200000).toISOString(), last_hit: new Date(Date.now() - 60000).toISOString(), ttl_seconds: 3600, size_bytes: 19800 },
  { id: "5", prompt_hash: "e9d8c7b6", model_id: "m2", model_name: "Claude 3.5 Sonnet", tokens_saved: 89400, hit_count: 678, created_at: new Date(Date.now() - 129600000).toISOString(), last_hit: new Date(Date.now() - 300000).toISOString(), ttl_seconds: 7200, size_bytes: 27600 },
];

export default function CachingPage() {
  const { models } = useStore();
  const cachableModels = models.filter((m) => m.supports_caching);
  const [entries, setEntries] = useState<CacheEntry[]>(SAMPLE_CACHE);
  const [globalTtl, setGlobalTtl] = useState(3600);
  const [maxCacheSize, setMaxCacheSize] = useState(1024);
  const [evictionPolicy, setEvictionPolicy] = useState("lru");

  const totalTokensSaved = entries.reduce((a, e) => a + e.tokens_saved, 0);
  const totalHits = entries.reduce((a, e) => a + e.hit_count, 0);
  const totalSize = entries.reduce((a, e) => a + e.size_bytes, 0);
  const estimatedSavings = totalTokensSaved * 0.00003;

  const hitsByModel = Object.entries(
    entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.model_name] = (acc[e.model_name] || 0) + e.hit_count;
      return acc;
    }, {})
  ).map(([name, hits]) => ({ name, hits }));

  const pieData = [
    { name: "Hits", value: totalHits },
    { name: "Misses", value: Math.round(totalHits * 0.35) },
  ];
  const COLORS = ["#6366f1", "#374151"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Prompt Caching</h1>
        <p className="text-gray-400">Optimize costs and latency with intelligent prompt caching</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Tokens Saved", value: totalTokensSaved.toLocaleString(), icon: Zap, color: "text-brand-400" },
          { label: "Cache Hits", value: totalHits.toLocaleString(), icon: TrendingUp, color: "text-emerald-400" },
          { label: "Est. Savings", value: `$${estimatedSavings.toFixed(2)}`, icon: Database, color: "text-yellow-400" },
          { label: "Cache Size", value: `${(totalSize / 1024).toFixed(1)} KB`, icon: Clock, color: "text-blue-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg bg-gray-800 p-2 ${stat.color}`}><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Cache Hits by Model</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hitsByModel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
              <Bar dataKey="hits" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Hit/Miss Ratio</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-brand-500" /> Hits ({((totalHits / (totalHits + totalHits * 0.35)) * 100).toFixed(0)}%)</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-gray-700" /> Misses</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Cache Entries</h3>
            <button onClick={() => { setEntries([]); toast.success("Cache cleared"); }} className="btn-danger text-xs"><Trash2 className="h-3 w-3" /> Clear All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="pb-2 text-left font-medium text-gray-500">Hash</th>
                  <th className="pb-2 text-left font-medium text-gray-500">Model</th>
                  <th className="pb-2 text-left font-medium text-gray-500">Tokens Saved</th>
                  <th className="pb-2 text-left font-medium text-gray-500">Hits</th>
                  <th className="pb-2 text-left font-medium text-gray-500">TTL</th>
                  <th className="pb-2 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-800/50">
                    <td className="py-2 font-mono text-xs text-gray-400">{entry.prompt_hash}</td>
                    <td className="py-2 text-gray-300">{entry.model_name}</td>
                    <td className="py-2 text-gray-300">{entry.tokens_saved.toLocaleString()}</td>
                    <td className="py-2 text-gray-300">{entry.hit_count}</td>
                    <td className="py-2 text-gray-300">{entry.ttl_seconds}s</td>
                    <td className="py-2">
                      <button onClick={() => { setEntries((p) => p.filter((e) => e.id !== entry.id)); toast.success("Evicted"); }} className="rounded p-1 text-gray-600 hover:text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">Cache Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Default TTL (seconds)</label>
              <input className="input" type="number" value={globalTtl} onChange={(e) => setGlobalTtl(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Max Cache Size (MB)</label>
              <input className="input" type="number" value={maxCacheSize} onChange={(e) => setMaxCacheSize(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Eviction Policy</label>
              <select className="input" value={evictionPolicy} onChange={(e) => setEvictionPolicy(e.target.value)}>
                <option value="lru">LRU (Least Recently Used)</option>
                <option value="lfu">LFU (Least Frequently Used)</option>
                <option value="ttl">TTL Based</option>
                <option value="fifo">FIFO (First In First Out)</option>
              </select>
            </div>
            <div>
              <label className="label">Cacheable Models</label>
              <div className="space-y-2 mt-2">
                {cachableModels.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" defaultChecked className="rounded border-gray-600 bg-gray-800" />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={() => toast.success("Settings saved")} className="btn-primary w-full justify-center">Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
