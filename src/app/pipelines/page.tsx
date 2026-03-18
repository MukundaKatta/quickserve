"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Trash2, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function PipelinesPage() {
  const { pipelines, models, addPipeline, deletePipeline, addPipelineStep, removePipelineStep } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [addStepTo, setAddStepTo] = useState<string | null>(null);
  const textModels = models.filter((m) => m.type === "text" || m.type === "embedding");

  const [stepForm, setStepForm] = useState({
    model_id: "",
    prompt_template: "",
    output_key: "",
    temperature: 0.7,
    max_tokens: 1024,
    json_mode: false,
    cache_enabled: false,
  });

  function handleCreatePipeline() {
    if (!newName) { toast.error("Name is required"); return; }
    addPipeline(newName, newDesc);
    setShowCreate(false);
    setNewName("");
    setNewDesc("");
    toast.success("Pipeline created");
  }

  function handleAddStep() {
    if (!addStepTo || !stepForm.model_id || !stepForm.output_key) {
      toast.error("Model and output key are required");
      return;
    }
    const model = models.find((m) => m.id === stepForm.model_id);
    addPipelineStep(addStepTo, {
      model_id: stepForm.model_id,
      model_name: model?.name || "Unknown",
      prompt_template: stepForm.prompt_template,
      input_mapping: {},
      output_key: stepForm.output_key,
      config: {
        temperature: stepForm.temperature,
        max_tokens: stepForm.max_tokens,
        json_mode: stepForm.json_mode,
        cache_enabled: stepForm.cache_enabled,
      },
    });
    setAddStepTo(null);
    setStepForm({ model_id: "", prompt_template: "", output_key: "", temperature: 0.7, max_tokens: 1024, json_mode: false, cache_enabled: false });
    toast.success("Step added");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compound AI Pipelines</h1>
          <p className="text-gray-400">Chain models together for complex workflows</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> New Pipeline</button>
      </div>

      <div className="space-y-4">
        {pipelines.map((pipeline) => (
          <div key={pipeline.id} className="card">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(expanded === pipeline.id ? null : pipeline.id)}
                className="flex items-center gap-3 text-left"
              >
                {expanded === pipeline.id ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                <div>
                  <h3 className="font-semibold text-white">{pipeline.name}</h3>
                  <p className="text-sm text-gray-400">{pipeline.description}</p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <span className="badge-blue">{pipeline.steps.length} steps</span>
                <button onClick={() => { deletePipeline(pipeline.id); toast.success("Deleted"); }} className="rounded p-1 text-gray-500 hover:bg-red-900/30 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {expanded === pipeline.id && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {pipeline.steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Step {i + 1}</p>
                            <p className="text-sm font-medium text-white">{step.model_name}</p>
                            <p className="text-xs text-gray-500">Output: {step.output_key}</p>
                          </div>
                          <button onClick={() => { removePipelineStep(pipeline.id, step.id); toast.success("Step removed"); }} className="rounded p-1 text-gray-600 hover:text-red-400">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {step.config.json_mode && <span className="mt-1 badge-blue text-[10px]">JSON</span>}
                        {step.config.cache_enabled && <span className="mt-1 ml-1 badge-yellow text-[10px]">Cached</span>}
                        <div className="mt-2 max-w-xs">
                          <p className="truncate text-xs text-gray-500">{step.prompt_template}</p>
                        </div>
                      </div>
                      {i < pipeline.steps.length - 1 && <ArrowRight className="h-4 w-4 text-gray-600" />}
                    </div>
                  ))}
                </div>
                <button onClick={() => setAddStepTo(pipeline.id)} className="btn-secondary text-xs">
                  <Plus className="h-3 w-3" /> Add Step
                </button>
              </div>
            )}
          </div>
        ))}
        {pipelines.length === 0 && (
          <div className="card text-center text-gray-500">No pipelines yet. Create one to get started.</div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Pipeline">
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Pipeline" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Describe what this pipeline does..." />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleCreatePipeline} className="btn-primary">Create</button>
        </div>
      </Modal>

      <Modal open={!!addStepTo} onClose={() => setAddStepTo(null)} title="Add Pipeline Step">
        <div className="space-y-4">
          <div>
            <label className="label">Model</label>
            <select className="input" value={stepForm.model_id} onChange={(e) => setStepForm({ ...stepForm, model_id: e.target.value })}>
              <option value="">Select model...</option>
              {textModels.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Prompt Template</label>
            <textarea className="input font-mono text-xs" rows={4} value={stepForm.prompt_template} onChange={(e) => setStepForm({ ...stepForm, prompt_template: e.target.value })} placeholder="Use {{variable}} for template variables" />
          </div>
          <div>
            <label className="label">Output Key</label>
            <input className="input" value={stepForm.output_key} onChange={(e) => setStepForm({ ...stepForm, output_key: e.target.value })} placeholder="result" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Temperature</label>
              <input className="input" type="number" step="0.1" min="0" max="2" value={stepForm.temperature} onChange={(e) => setStepForm({ ...stepForm, temperature: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Max Tokens</label>
              <input className="input" type="number" value={stepForm.max_tokens} onChange={(e) => setStepForm({ ...stepForm, max_tokens: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={stepForm.json_mode} onChange={(e) => setStepForm({ ...stepForm, json_mode: e.target.checked })} className="rounded border-gray-600 bg-gray-800" />
              JSON Mode
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={stepForm.cache_enabled} onChange={(e) => setStepForm({ ...stepForm, cache_enabled: e.target.checked })} className="rounded border-gray-600 bg-gray-800" />
              Enable Cache
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setAddStepTo(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleAddStep} className="btn-primary">Add Step</button>
        </div>
      </Modal>
    </div>
  );
}
