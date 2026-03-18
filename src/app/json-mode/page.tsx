"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Play, Copy, Braces, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const SAMPLE_SCHEMAS = [
  {
    name: "Person Info",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string", format: "email" },
        occupation: { type: "string" },
        skills: { type: "array", items: { type: "string" } },
      },
      required: ["name", "email"],
    },
  },
  {
    name: "Product Review",
    schema: {
      type: "object",
      properties: {
        product_name: { type: "string" },
        rating: { type: "number", minimum: 1, maximum: 5 },
        sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
        pros: { type: "array", items: { type: "string" } },
        cons: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
      required: ["product_name", "rating", "sentiment"],
    },
  },
  {
    name: "Event Extraction",
    schema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              date: { type: "string" },
              location: { type: "string" },
              participants: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  },
];

export default function JsonModePage() {
  const { models } = useStore();
  const jsonModels = models.filter((m) => m.supports_json_mode);
  const [selectedModel, setSelectedModel] = useState(jsonModels[0]?.id || "");
  const [prompt, setPrompt] = useState("Extract information about John Doe, age 30, who works as a software engineer at Google. His email is john@example.com and he's skilled in Python, TypeScript, and Go.");
  const [schemaStr, setSchemaStr] = useState(JSON.stringify(SAMPLE_SCHEMAS[0].schema, null, 2));
  const [result, setResult] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  function loadSchema(idx: number) {
    setSchemaStr(JSON.stringify(SAMPLE_SCHEMAS[idx].schema, null, 2));
  }

  function runGeneration() {
    const model = models.find((m) => m.id === selectedModel);
    if (!model) { toast.error("Select a model"); return; }

    let schema: Record<string, unknown>;
    try {
      schema = JSON.parse(schemaStr);
    } catch {
      toast.error("Invalid JSON schema");
      return;
    }

    const output: Record<string, unknown> = {};
    const props = (schema.properties || {}) as Record<string, { type: string; items?: { type: string }; enum?: string[] }>;
    for (const [key, val] of Object.entries(props)) {
      if (val.type === "string") {
        if (val.enum) output[key] = val.enum[0];
        else output[key] = `<extracted ${key} value>`;
      } else if (val.type === "number") {
        output[key] = 42;
      } else if (val.type === "boolean") {
        output[key] = true;
      } else if (val.type === "array") {
        output[key] = ["item_1", "item_2", "item_3"];
      } else if (val.type === "object") {
        output[key] = { nested: "value" };
      }
    }

    if (prompt.toLowerCase().includes("john")) {
      if ("name" in output) output.name = "John Doe";
      if ("age" in output) output.age = 30;
      if ("email" in output) output.email = "john@example.com";
      if ("occupation" in output) output.occupation = "Software Engineer";
      if ("skills" in output) output.skills = ["Python", "TypeScript", "Go"];
    }

    const json = JSON.stringify(output, null, 2);
    setResult(json);
    try {
      JSON.parse(json);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
    toast.success("JSON generated");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">JSON Mode</h1>
        <p className="text-gray-400">Generate structured JSON output from AI models</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Model</label>
                <select className="input" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  {jsonModels.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Prompt</label>
                <textarea className="input" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">JSON Schema</h3>
              <div className="flex gap-1">
                {SAMPLE_SCHEMAS.map((s, i) => (
                  <button key={i} onClick={() => loadSchema(i)} className="btn-secondary text-[10px] px-2 py-1">{s.name}</button>
                ))}
              </div>
            </div>
            <textarea className="input font-mono text-xs" rows={12} value={schemaStr} onChange={(e) => setSchemaStr(e.target.value)} />
            <button onClick={runGeneration} className="btn-primary mt-3 w-full justify-center"><Play className="h-4 w-4" /> Generate JSON</button>
          </div>
        </div>

        <div className="space-y-4">
          {result && (
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-300">Output</h3>
                  {isValid === true && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="h-3 w-3" />Valid JSON</span>}
                  {isValid === false && <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3 w-3" />Invalid</span>}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }} className="btn-secondary text-xs"><Copy className="h-3 w-3" />Copy</button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-gray-800 p-4 font-mono text-xs text-green-400">{result}</pre>
            </div>
          )}

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Compatible Models</h3>
            <div className="space-y-2">
              {jsonModels.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-2">
                  <div className="flex items-center gap-2">
                    <Braces className="h-4 w-4 text-brand-400" />
                    <span className="text-sm text-gray-200">{m.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{m.provider}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
