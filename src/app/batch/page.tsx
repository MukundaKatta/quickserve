"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Play, Pause, RotateCcw, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function BatchInferencePage() {
  const { models, batchJobs, createBatchJob, updateBatchJob } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]?.id || "");
  const [totalRequests, setTotalRequests] = useState(100);
  const [inputData, setInputData] = useState("");

  function handleCreate() {
    if (!selectedModel) { toast.error("Select a model"); return; }
    createBatchJob({ pipeline_id: null, model_id: selectedModel, total_requests: totalRequests });
    setShowCreate(false);
    toast.success("Batch job created");
  }

  function simulateProgress(jobId: string) {
    const job = batchJobs.find((j) => j.id === jobId);
    if (!job || job.status === "completed") return;
    updateBatchJob(jobId, { status: "running" });
    const interval = setInterval(() => {
      const current = useStore.getState().batchJobs.find((j) => j.id === jobId);
      if (!current || current.completed_requests >= current.total_requests) {
        clearInterval(interval);
        updateBatchJob(jobId, { status: "completed", completed_at: new Date().toISOString() });
        toast.success("Batch job completed");
        return;
      }
      const increment = Math.min(
        Math.floor(Math.random() * 50) + 10,
        current.total_requests - current.completed_requests
      );
      const fails = Math.random() < 0.1 ? 1 : 0;
      updateBatchJob(jobId, {
        completed_requests: current.completed_requests + increment,
        failed_requests: current.failed_requests + fails,
      });
    }, 500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Batch Inference</h1>
          <p className="text-gray-400">Process large datasets with bulk AI inference</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> New Batch Job</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold text-white">{batchJobs.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Running</p>
          <p className="text-2xl font-bold text-blue-400">{batchJobs.filter((j) => j.status === "running").length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{batchJobs.filter((j) => j.status === "completed").length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold text-white">{batchJobs.reduce((a, j) => a + j.total_requests, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        {batchJobs.map((job) => {
          const model = models.find((m) => m.id === job.model_id);
          const progress = job.total_requests > 0 ? (job.completed_requests / job.total_requests) * 100 : 0;
          return (
            <div key={job.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">{model?.name || "Unknown Model"}</h3>
                    <span className={
                      job.status === "completed" ? "badge-green" :
                      job.status === "running" ? "badge-blue" :
                      job.status === "failed" ? "badge-red" : "badge-yellow"
                    }>{job.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(job.created_at).toLocaleString()} | ID: {job.id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {job.status === "pending" && (
                    <button onClick={() => simulateProgress(job.id)} className="btn-primary text-xs"><Play className="h-3 w-3" /> Start</button>
                  )}
                  {job.status === "running" && (
                    <button onClick={() => updateBatchJob(job.id, { status: "pending" })} className="btn-secondary text-xs"><Pause className="h-3 w-3" /> Pause</button>
                  )}
                  {job.status === "completed" && (
                    <button onClick={() => toast.success("Results downloaded")} className="btn-secondary text-xs"><Download className="h-3 w-3" /> Download</button>
                  )}
                  {job.status === "failed" && (
                    <button onClick={() => updateBatchJob(job.id, { status: "pending", completed_requests: 0, failed_requests: 0 })} className="btn-secondary text-xs"><RotateCcw className="h-3 w-3" /> Retry</button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>{job.completed_requests.toLocaleString()} / {job.total_requests.toLocaleString()} completed</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                  <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                {job.failed_requests > 0 && (
                  <p className="mt-1 text-xs text-red-400">{job.failed_requests} failed requests</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Batch Job">
        <div className="space-y-4">
          <div>
            <label className="label">Model</label>
            <select className="input" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {models.filter((m) => m.type === "text").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Number of Requests</label>
            <input className="input" type="number" value={totalRequests} onChange={(e) => setTotalRequests(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Input Data (JSONL)</label>
            <textarea className="input font-mono text-xs" rows={6} value={inputData} onChange={(e) => setInputData(e.target.value)}
              placeholder={'{"prompt": "Hello, world!"}\n{"prompt": "Summarize this..."}\n{"prompt": "Translate to French..."}'} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleCreate} className="btn-primary">Create Job</button>
        </div>
      </Modal>
    </div>
  );
}
