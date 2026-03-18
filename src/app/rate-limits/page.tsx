"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Trash2, Edit2, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

export default function RateLimitsPage() {
  const { models, rateLimits, addRateLimit, updateRateLimit, deleteRateLimit } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    model_id: null as string | null,
    requests_per_minute: 60,
    tokens_per_minute: 100000,
    concurrent_requests: 10,
    enabled: true,
  });

  const editingRule = rateLimits.find((r) => r.id === editId);

  function handleCreate() {
    if (!form.name) { toast.error("Name is required"); return; }
    addRateLimit(form);
    setShowCreate(false);
    resetForm();
    toast.success("Rate limit created");
  }

  function handleUpdate() {
    if (!editId) return;
    updateRateLimit(editId, form);
    setEditId(null);
    resetForm();
    toast.success("Rate limit updated");
  }

  function resetForm() {
    setForm({ name: "", model_id: null, requests_per_minute: 60, tokens_per_minute: 100000, concurrent_requests: 10, enabled: true });
  }

  function startEdit(id: string) {
    const rule = rateLimits.find((r) => r.id === id);
    if (!rule) return;
    setForm({
      name: rule.name,
      model_id: rule.model_id,
      requests_per_minute: rule.requests_per_minute,
      tokens_per_minute: rule.tokens_per_minute,
      concurrent_requests: rule.concurrent_requests,
      enabled: rule.enabled,
    });
    setEditId(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rate Limiting</h1>
          <p className="text-gray-400">Configure request and token rate limits per tier</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> New Rule</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {rateLimits.map((rule) => (
          <div key={rule.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${rule.enabled ? "bg-brand-600/20 text-brand-400" : "bg-gray-800 text-gray-600"}`}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{rule.name}</h3>
                  <p className="text-xs text-gray-500">
                    {rule.model_id ? models.find((m) => m.id === rule.model_id)?.name || "Specific Model" : "All Models"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => updateRateLimit(rule.id, { enabled: !rule.enabled })} className="rounded p-1 text-gray-500 hover:text-white">
                  {rule.enabled ? <ToggleRight className="h-4 w-4 text-brand-400" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button onClick={() => startEdit(rule.id)} className="rounded p-1 text-gray-500 hover:text-white"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => { deleteRateLimit(rule.id); toast.success("Deleted"); }} className="rounded p-1 text-gray-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-800/50 p-2 text-center">
                <p className="text-lg font-bold text-white">{rule.requests_per_minute}</p>
                <p className="text-[10px] text-gray-500">req/min</p>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-2 text-center">
                <p className="text-lg font-bold text-white">{(rule.tokens_per_minute / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-gray-500">tok/min</p>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-2 text-center">
                <p className="text-lg font-bold text-white">{rule.concurrent_requests}</p>
                <p className="text-[10px] text-gray-500">concurrent</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shared form for create/edit */}
      {[
        { open: showCreate, onClose: () => setShowCreate(false), title: "Create Rate Limit", action: handleCreate, actionLabel: "Create" },
        { open: !!editId, onClose: () => setEditId(null), title: "Edit Rate Limit", action: handleUpdate, actionLabel: "Update" },
      ].map((modal, i) => (
        <Modal key={i} open={modal.open} onClose={modal.onClose} title={modal.title}>
          <div className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enterprise Tier" />
            </div>
            <div>
              <label className="label">Apply to Model (optional)</label>
              <select className="input" value={form.model_id || ""} onChange={(e) => setForm({ ...form, model_id: e.target.value || null })}>
                <option value="">All Models</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Req/min</label>
                <input className="input" type="number" value={form.requests_per_minute} onChange={(e) => setForm({ ...form, requests_per_minute: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Tok/min</label>
                <input className="input" type="number" value={form.tokens_per_minute} onChange={(e) => setForm({ ...form, tokens_per_minute: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Concurrent</label>
                <input className="input" type="number" value={form.concurrent_requests} onChange={(e) => setForm({ ...form, concurrent_requests: Number(e.target.value) })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="rounded border-gray-600 bg-gray-800" />
              Enabled
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={modal.onClose} className="btn-secondary">Cancel</button>
            <button onClick={modal.action} className="btn-primary">{modal.actionLabel}</button>
          </div>
        </Modal>
      ))}
    </div>
  );
}
