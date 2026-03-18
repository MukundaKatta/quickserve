"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Play, Plus, Trash2, Copy, Code } from "lucide-react";
import toast from "react-hot-toast";
import type { FunctionDef } from "@/lib/supabase";

const SAMPLE_FUNCTIONS: FunctionDef[] = [
  {
    name: "get_weather",
    description: "Get the current weather in a given location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City and state, e.g. San Francisco, CA" },
        unit: { type: "string", enum: ["celsius", "fahrenheit"], description: "Temperature unit" },
      },
      required: ["location"],
    },
  },
  {
    name: "search_products",
    description: "Search for products in the catalog",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        category: { type: "string", description: "Product category" },
        max_price: { type: "number", description: "Maximum price filter" },
        in_stock: { type: "boolean", description: "Only show in-stock items" },
      },
      required: ["query"],
    },
  },
  {
    name: "create_task",
    description: "Create a new task in the project management system",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        description: { type: "string", description: "Task description" },
        assignee: { type: "string", description: "Person assigned" },
        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
        due_date: { type: "string", description: "Due date in ISO format" },
      },
      required: ["title"],
    },
  },
];

export default function FunctionCallingPage() {
  const { models } = useStore();
  const fnModels = models.filter((m) => m.supports_function_calling);
  const [selectedModel, setSelectedModel] = useState(fnModels[0]?.id || "");
  const [functions, setFunctions] = useState<FunctionDef[]>(SAMPLE_FUNCTIONS);
  const [prompt, setPrompt] = useState("What's the weather like in San Francisco?");
  const [result, setResult] = useState<string>("");
  const [newFnJson, setNewFnJson] = useState("");
  const [showAddFn, setShowAddFn] = useState(false);

  function runTest() {
    const model = models.find((m) => m.id === selectedModel);
    if (!model) { toast.error("Select a model"); return; }

    const matchedFn = functions.find((fn) => {
      const keywords = fn.description.toLowerCase().split(" ");
      return keywords.some((k) => prompt.toLowerCase().includes(k));
    });

    if (matchedFn) {
      const mockArgs: Record<string, string> = {};
      const params = matchedFn.parameters as { properties?: Record<string, { type: string }> };
      if (params.properties) {
        for (const [key, val] of Object.entries(params.properties)) {
          if (val.type === "string") mockArgs[key] = `<extracted from: "${prompt.slice(0, 30)}...">`;
          else if (val.type === "number") mockArgs[key] = "42";
          else if (val.type === "boolean") mockArgs[key] = "true";
        }
      }
      setResult(JSON.stringify({
        model: model.name,
        function_call: {
          name: matchedFn.name,
          arguments: mockArgs,
        },
        finish_reason: "function_call",
      }, null, 2));
    } else {
      setResult(JSON.stringify({
        model: model.name,
        content: `I'll help you with that. Based on your query: "${prompt}"`,
        finish_reason: "stop",
      }, null, 2));
    }
    toast.success("Function call executed");
  }

  function addFunction() {
    try {
      const parsed = JSON.parse(newFnJson);
      if (!parsed.name || !parsed.description || !parsed.parameters) {
        toast.error("Function must have name, description, and parameters");
        return;
      }
      setFunctions((prev) => [...prev, parsed]);
      setNewFnJson("");
      setShowAddFn(false);
      toast.success("Function added");
    } catch {
      toast.error("Invalid JSON");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Function Calling Studio</h1>
        <p className="text-gray-400">Test and configure function calling with AI models</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Model</label>
                <select className="input" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  {fnModels.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
                </select>
              </div>
              <div>
                <label className="label">User Prompt</label>
                <textarea className="input" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>
              <button onClick={runTest} className="btn-primary w-full justify-center"><Play className="h-4 w-4" /> Execute</button>
            </div>
          </div>

          {result && (
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">Result</h3>
                <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }} className="btn-secondary text-xs">
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-gray-800 p-4 font-mono text-xs text-green-400">{result}</pre>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Registered Functions</h3>
            <button onClick={() => setShowAddFn(!showAddFn)} className="btn-secondary text-xs">
              <Plus className="h-3 w-3" /> Add Function
            </button>
          </div>

          {showAddFn && (
            <div className="card">
              <label className="label">Function Definition (JSON)</label>
              <textarea className="input font-mono text-xs" rows={10} value={newFnJson} onChange={(e) => setNewFnJson(e.target.value)}
                placeholder={`{
  "name": "my_function",
  "description": "Description of what it does",
  "parameters": {
    "type": "object",
    "properties": {
      "param1": { "type": "string" }
    },
    "required": ["param1"]
  }
}`} />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setShowAddFn(false)} className="btn-secondary text-xs">Cancel</button>
                <button onClick={addFunction} className="btn-primary text-xs">Add</button>
              </div>
            </div>
          )}

          {functions.map((fn, i) => (
            <div key={i} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-brand-400" />
                  <span className="font-mono text-sm font-semibold text-white">{fn.name}</span>
                </div>
                <button onClick={() => setFunctions((prev) => prev.filter((_, j) => j !== i))} className="rounded p-1 text-gray-600 hover:text-red-400">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-400">{fn.description}</p>
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500">Parameters:</p>
                <pre className="mt-1 overflow-x-auto rounded bg-gray-800 p-2 font-mono text-[11px] text-gray-400">
                  {JSON.stringify(fn.parameters, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
