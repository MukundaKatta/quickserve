"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Trash2, Search, Filter } from "lucide-react";
import type { Model } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ModelsPage() {
  const { models, addModel, deleteModel } = useStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    provider: "",
    type: "text" as Model["type"],
    context_window: 128000,
    max_tokens: 4096,
    price_per_1k_input: 0.01,
    price_per_1k_output: 0.03,
    supports_json_mode: true,
    supports_function_calling: true,
    supports_grammar: false,
    supports_caching: true,
    status: "active" as Model["status"],
  });

  const providers = Array.from(new Set(models.map((m) => m.provider)));
  const types = Array.from(new Set(models.map((m) => m.type)));

  const filtered = models.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (providerFilter !== "all" && m.provider !== providerFilter) return false;
    return true;
  });

  function handleAdd() {
    if (!form.name || !form.provider) {
      toast.error("Name and provider are required");
      return;
    }
    addModel(form);
    setShowAdd(false);
    toast.success("Model added");
    setForm({
      name: "", provider: "", type: "text", context_window: 128000, max_tokens: 4096,
      price_per_1k_input: 0.01, price_per_1k_output: 0.03, supports_json_mode: true,
      supports_function_calling: true, supports_grammar: false, supports_caching: true, status: "active",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Model Catalog</h1>
          <p className="text-gray-400">Manage AI models available for serving</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Model
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input w-auto" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
          <option value="all">All Providers</option>
          {providers.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50">
              <th className="px-4 py-3 text-left font-medium text-gray-400">Model</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Provider</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Context</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Price (in/out)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Features</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((model) => (
              <tr key={model.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 font-medium text-white">{model.name}</td>
                <td className="px-4 py-3 text-gray-300">{model.provider}</td>
                <td className="px-4 py-3">
                  <span className={
                    model.type === "text" ? "badge-blue" :
                    model.type === "embedding" ? "badge-purple" :
                    model.type === "image" ? "badge-green" : "badge-yellow"
                  }>{model.type}</span>
                </td>
                <td className="px-4 py-3 text-gray-300">{model.context_window.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300">
                  ${model.price_per_1k_input}/{model.price_per_1k_output > 0 ? `$${model.price_per_1k_output}` : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {model.supports_json_mode && <span className="badge-blue">JSON</span>}
                    {model.supports_function_calling && <span className="badge-green">Functions</span>}
                    {model.supports_grammar && <span className="badge-purple">Grammar</span>}
                    {model.supports_caching && <span className="badge-yellow">Cache</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={model.status === "active" ? "badge-green" : model.status === "beta" ? "badge-yellow" : "badge-red"}>
                    {model.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => { deleteModel(model.id); toast.success("Model removed"); }} className="rounded p-1 text-gray-500 hover:bg-red-900/30 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">No models found</div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Model" width="max-w-2xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="GPT-4o" />
          </div>
          <div>
            <label className="label">Provider</label>
            <input className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="OpenAI" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Model["type"] })}>
              <option value="text">Text</option>
              <option value="embedding">Embedding</option>
              <option value="image">Image</option>
              <option value="audio">Audio</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Model["status"] })}>
              <option value="active">Active</option>
              <option value="beta">Beta</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>
          <div>
            <label className="label">Context Window</label>
            <input className="input" type="number" value={form.context_window} onChange={(e) => setForm({ ...form, context_window: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Max Tokens</label>
            <input className="input" type="number" value={form.max_tokens} onChange={(e) => setForm({ ...form, max_tokens: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Price per 1K Input</label>
            <input className="input" type="number" step="0.001" value={form.price_per_1k_input} onChange={(e) => setForm({ ...form, price_per_1k_input: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Price per 1K Output</label>
            <input className="input" type="number" step="0.001" value={form.price_per_1k_output} onChange={(e) => setForm({ ...form, price_per_1k_output: Number(e.target.value) })} />
          </div>
          <div className="col-span-2 flex flex-wrap gap-4">
            {(["supports_json_mode", "supports_function_calling", "supports_grammar", "supports_caching"] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="rounded border-gray-600 bg-gray-800" />
                {key.replace("supports_", "").replace("_", " ")}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleAdd} className="btn-primary">Add Model</button>
        </div>
      </Modal>
    </div>
  );
}
