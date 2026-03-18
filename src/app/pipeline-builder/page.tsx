"use client";

import { useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Trash2, Play, Save, ArrowDown, Settings, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import type { PipelineStep, StepConfig } from "@/lib/supabase";

interface BuilderNode {
  id: string;
  model_id: string;
  model_name: string;
  prompt_template: string;
  output_key: string;
  config: StepConfig;
  x: number;
  y: number;
}

export default function PipelineBuilderPage() {
  const { models, addPipeline, addPipelineStep } = useStore();
  const textModels = models.filter((m) => m.type === "text" || m.type === "embedding");
  const [nodes, setNodes] = useState<BuilderNode[]>([]);
  const [pipelineName, setPipelineName] = useState("Untitled Pipeline");
  const [pipelineDesc, setPipelineDesc] = useState("");
  const [editNode, setEditNode] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState<string>("");
  const [testInput, setTestInput] = useState("");
  const [showTest, setShowTest] = useState(false);

  const addNode = useCallback(() => {
    const defaultModel = textModels[0];
    if (!defaultModel) { toast.error("No models available"); return; }
    const node: BuilderNode = {
      id: uuidv4(),
      model_id: defaultModel.id,
      model_name: defaultModel.name,
      prompt_template: "",
      output_key: `step_${nodes.length + 1}`,
      config: { temperature: 0.7, max_tokens: 1024, json_mode: false, cache_enabled: false },
      x: 100,
      y: nodes.length * 200 + 50,
    };
    setNodes((prev) => [...prev, node]);
  }, [nodes.length, textModels]);

  const updateNode = useCallback((id: string, updates: Partial<BuilderNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  }, []);

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const savePipeline = useCallback(() => {
    if (!pipelineName) { toast.error("Pipeline name is required"); return; }
    if (nodes.length === 0) { toast.error("Add at least one step"); return; }
    const pipeline = addPipeline(pipelineName, pipelineDesc);
    nodes.forEach((node) => {
      addPipelineStep(pipeline.id, {
        model_id: node.model_id,
        model_name: node.model_name,
        prompt_template: node.prompt_template,
        input_mapping: {},
        output_key: node.output_key,
        config: node.config,
      });
    });
    toast.success("Pipeline saved!");
  }, [pipelineName, pipelineDesc, nodes, addPipeline, addPipelineStep]);

  const runTest = useCallback(() => {
    const outputs: string[] = [];
    let currentInput = testInput;
    for (const node of nodes) {
      const rendered = node.prompt_template.replace(/\{\{.*?\}\}/g, currentInput);
      const mockOutput = `[${node.model_name}] Generated output for: "${rendered.slice(0, 50)}..."`;
      outputs.push(`Step "${node.output_key}" (${node.model_name}):\n${mockOutput}`);
      currentInput = mockOutput;
    }
    setTestOutput(outputs.join("\n\n---\n\n"));
  }, [testInput, nodes]);

  const editingNode = nodes.find((n) => n.id === editNode);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline Builder</h1>
          <p className="text-gray-400">Visually design compound AI pipelines</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTest(true)} className="btn-secondary"><Play className="h-4 w-4" /> Test</button>
          <button onClick={savePipeline} className="btn-primary"><Save className="h-4 w-4" /> Save Pipeline</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card min-h-[600px]">
            <div className="mb-4 flex items-center gap-4">
              <input className="input max-w-xs font-semibold" value={pipelineName} onChange={(e) => setPipelineName(e.target.value)} />
              <input className="input flex-1" placeholder="Description..." value={pipelineDesc} onChange={(e) => setPipelineDesc(e.target.value)} />
            </div>

            <div className="space-y-3">
              {nodes.map((node, idx) => (
                <div key={node.id}>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition hover:border-brand-600">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600/20 text-brand-400 text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{node.model_name}</p>
                          <p className="text-xs text-gray-500">Output: {node.output_key}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditNode(node.id)} className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-white">
                            <Settings className="h-4 w-4" />
                          </button>
                          <button onClick={() => removeNode(node.id)} className="rounded p-1 text-gray-500 hover:bg-red-900/30 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="input font-mono text-xs"
                        rows={3}
                        value={node.prompt_template}
                        onChange={(e) => updateNode(node.id, { prompt_template: e.target.value })}
                        placeholder="Enter prompt template. Use {{variable}} for inputs."
                      />
                      <div className="flex flex-wrap gap-1">
                        {node.config.json_mode && <span className="badge-blue text-[10px]">JSON Mode</span>}
                        {node.config.cache_enabled && <span className="badge-yellow text-[10px]">Cached</span>}
                        <span className="badge-purple text-[10px]">Temp: {node.config.temperature}</span>
                        <span className="badge-green text-[10px]">Max: {node.config.max_tokens}</span>
                      </div>
                    </div>
                  </div>
                  {idx < nodes.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              <button onClick={addNode} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-700 py-6 text-gray-500 transition hover:border-brand-600 hover:text-brand-400">
                <Plus className="h-5 w-5" /> Add Step
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Available Models</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {textModels.map((model) => (
                <div key={model.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-2">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{model.name}</p>
                    <p className="text-xs text-gray-500">{model.provider}</p>
                  </div>
                  <span className={model.type === "embedding" ? "badge-purple" : "badge-blue"}>{model.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Pipeline Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Steps</span>
                <span className="text-white">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Models Used</span>
                <span className="text-white">{new Set(nodes.map((n) => n.model_id)).size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">JSON Outputs</span>
                <span className="text-white">{nodes.filter((n) => n.config.json_mode).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cached Steps</span>
                <span className="text-white">{nodes.filter((n) => n.config.cache_enabled).length}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Tips</h3>
            <ul className="space-y-2 text-xs text-gray-500">
              <li className="flex gap-2"><Zap className="h-3 w-3 flex-shrink-0 text-brand-400 mt-0.5" />Use {"{{variable}}"} syntax in prompts for dynamic inputs</li>
              <li className="flex gap-2"><Zap className="h-3 w-3 flex-shrink-0 text-brand-400 mt-0.5" />Enable JSON mode for structured outputs</li>
              <li className="flex gap-2"><Zap className="h-3 w-3 flex-shrink-0 text-brand-400 mt-0.5" />Use caching for repeated similar queries</li>
              <li className="flex gap-2"><Zap className="h-3 w-3 flex-shrink-0 text-brand-400 mt-0.5" />Chain embedding models with text models for RAG</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal open={!!editNode} onClose={() => setEditNode(null)} title="Configure Step">
        {editingNode && (
          <div className="space-y-4">
            <div>
              <label className="label">Model</label>
              <select className="input" value={editingNode.model_id}
                onChange={(e) => {
                  const m = models.find((x) => x.id === e.target.value);
                  updateNode(editingNode.id, { model_id: e.target.value, model_name: m?.name || "" });
                }}>
                {textModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Output Key</label>
              <input className="input" value={editingNode.output_key}
                onChange={(e) => updateNode(editingNode.id, { output_key: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Temperature</label>
                <input className="input" type="number" step="0.1" min="0" max="2"
                  value={editingNode.config.temperature}
                  onChange={(e) => updateNode(editingNode.id, { config: { ...editingNode.config, temperature: Number(e.target.value) } })} />
              </div>
              <div>
                <label className="label">Max Tokens</label>
                <input className="input" type="number"
                  value={editingNode.config.max_tokens}
                  onChange={(e) => updateNode(editingNode.id, { config: { ...editingNode.config, max_tokens: Number(e.target.value) } })} />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={editingNode.config.json_mode}
                  onChange={(e) => updateNode(editingNode.id, { config: { ...editingNode.config, json_mode: e.target.checked } })}
                  className="rounded border-gray-600 bg-gray-800" />
                JSON Mode
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={editingNode.config.cache_enabled}
                  onChange={(e) => updateNode(editingNode.id, { config: { ...editingNode.config, cache_enabled: e.target.checked } })}
                  className="rounded border-gray-600 bg-gray-800" />
                Cache
              </label>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setEditNode(null)} className="btn-primary">Done</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showTest} onClose={() => setShowTest(false)} title="Test Pipeline" width="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="label">Input</label>
            <textarea className="input" rows={3} value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder="Enter test input..." />
          </div>
          <button onClick={runTest} className="btn-primary"><Play className="h-4 w-4" /> Run Test</button>
          {testOutput && (
            <div>
              <label className="label">Output</label>
              <pre className="input overflow-x-auto whitespace-pre-wrap font-mono text-xs">{testOutput}</pre>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
