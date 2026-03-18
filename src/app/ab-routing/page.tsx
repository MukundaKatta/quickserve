"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Trash2, Play, Pause, GitCompare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import toast from "react-hot-toast";

export default function ABRoutingPage() {
  const { models, abRoutes, addABRoute, updateABRoute, deleteABRoute } = useStore();
  const textModels = models.filter((m) => m.type === "text");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    model_a_id: "",
    model_b_id: "",
    traffic_split: 50,
    status: "active" as "active" | "paused",
  });

  function handleCreate() {
    if (!form.name || !form.model_a_id || !form.model_b_id) {
      toast.error("All fields required");
      return;
    }
    if (form.model_a_id === form.model_b_id) {
      toast.error("Select different models");
      return;
    }
    const ma = models.find((m) => m.id === form.model_a_id);
    const mb = models.find((m) => m.id === form.model_b_id);
    addABRoute({
      name: form.name,
      model_a_id: form.model_a_id,
      model_b_id: form.model_b_id,
      model_a_name: ma?.name || "",
      model_b_name: mb?.name || "",
      traffic_split: form.traffic_split,
      status: form.status,
    });
    setShowCreate(false);
    setForm({ name: "", model_a_id: "", model_b_id: "", traffic_split: 50, status: "active" });
    toast.success("A/B route created");
  }

  const comparisonData = abRoutes.map((route) => ([
    { name: "Latency (ms)", A: route.metrics.a_latency, B: route.metrics.b_latency },
    { name: "Quality", A: Math.round(route.metrics.a_quality * 100), B: Math.round(route.metrics.b_quality * 100) },
  ]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">A/B Routing</h1>
          <p className="text-gray-400">Compare model performance with traffic splitting</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> New A/B Test</button>
      </div>

      <div className="space-y-6">
        {abRoutes.map((route, ri) => (
          <div key={route.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GitCompare className="h-5 w-5 text-brand-400" />
                <div>
                  <h3 className="font-semibold text-white">{route.name}</h3>
                  <p className="text-sm text-gray-500">Created: {new Date(route.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={route.status === "active" ? "badge-green" : "badge-yellow"}>{route.status}</span>
                <button onClick={() => updateABRoute(route.id, { status: route.status === "active" ? "paused" : "active" })} className="btn-secondary text-xs">
                  {route.status === "active" ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Resume</>}
                </button>
                <button onClick={() => { deleteABRoute(route.id); toast.success("Deleted"); }} className="rounded p-1 text-gray-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="space-y-3">
                <div className="rounded-lg bg-blue-900/20 border border-blue-800/30 p-3">
                  <p className="text-xs text-blue-400 font-medium">Model A ({route.traffic_split}%)</p>
                  <p className="text-sm font-semibold text-white">{route.model_a_name}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Latency:</span> <span className="text-white">{route.metrics.a_latency}ms</span></div>
                    <div><span className="text-gray-500">Quality:</span> <span className="text-white">{(route.metrics.a_quality * 100).toFixed(0)}%</span></div>
                  </div>
                </div>
                <div className="rounded-lg bg-purple-900/20 border border-purple-800/30 p-3">
                  <p className="text-xs text-purple-400 font-medium">Model B ({100 - route.traffic_split}%)</p>
                  <p className="text-sm font-semibold text-white">{route.model_b_name}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Latency:</span> <span className="text-white">{route.metrics.b_latency}ms</span></div>
                    <div><span className="text-gray-500">Quality:</span> <span className="text-white">{(route.metrics.b_quality * 100).toFixed(0)}%</span></div>
                  </div>
                </div>
                <div>
                  <label className="label">Traffic Split: {route.traffic_split}% / {100 - route.traffic_split}%</label>
                  <input type="range" min={0} max={100} value={route.traffic_split}
                    onChange={(e) => updateABRoute(route.id, { traffic_split: Number(e.target.value) })}
                    className="w-full accent-brand-500" />
                </div>
              </div>

              <div className="lg:col-span-2">
                {comparisonData[ri] && (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={comparisonData[ri]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis type="number" stroke="#6b7280" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="A" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Model A" />
                      <Bar dataKey="B" fill="#a855f7" radius={[0, 4, 4, 0]} name="Model B" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        ))}
        {abRoutes.length === 0 && <div className="card text-center text-gray-500">No A/B tests configured</div>}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create A/B Test">
        <div className="space-y-4">
          <div>
            <label className="label">Test Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="GPT-4 vs Claude" />
          </div>
          <div>
            <label className="label">Model A</label>
            <select className="input" value={form.model_a_id} onChange={(e) => setForm({ ...form, model_a_id: e.target.value })}>
              <option value="">Select...</option>
              {textModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Model B</label>
            <select className="input" value={form.model_b_id} onChange={(e) => setForm({ ...form, model_b_id: e.target.value })}>
              <option value="">Select...</option>
              {textModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Traffic Split (A%): {form.traffic_split}%</label>
            <input type="range" min={0} max={100} value={form.traffic_split} onChange={(e) => setForm({ ...form, traffic_split: Number(e.target.value) })} className="w-full accent-brand-500" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleCreate} className="btn-primary">Create Test</button>
        </div>
      </Modal>
    </div>
  );
}
