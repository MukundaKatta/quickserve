"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Play, Copy, Zap, Hash } from "lucide-react";
import toast from "react-hot-toast";

function generateMockEmbedding(dim: number): number[] {
  const emb: number[] = [];
  for (let i = 0; i < dim; i++) {
    emb.push(Math.round((Math.random() * 2 - 1) * 10000) / 10000);
  }
  return emb;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default function EmbeddingsPage() {
  const { models } = useStore();
  const embeddingModels = models.filter((m) => m.type === "embedding");
  const [selectedModel, setSelectedModel] = useState(embeddingModels[0]?.id || "");
  const [inputTexts, setInputTexts] = useState("The quick brown fox jumps over the lazy dog.\nArtificial intelligence is transforming healthcare.\nMachine learning models require large datasets.");
  const [dimensions, setDimensions] = useState(256);
  const [results, setResults] = useState<{ text: string; embedding: number[] }[]>([]);
  const [similarities, setSimilarities] = useState<{ a: string; b: string; score: number }[]>([]);

  function generateEmbeddings() {
    const texts = inputTexts.split("\n").filter((t) => t.trim());
    if (texts.length === 0) { toast.error("Enter at least one text"); return; }

    const embResults = texts.map((text) => ({
      text,
      embedding: generateMockEmbedding(dimensions),
    }));
    setResults(embResults);

    const sims: { a: string; b: string; score: number }[] = [];
    for (let i = 0; i < embResults.length; i++) {
      for (let j = i + 1; j < embResults.length; j++) {
        sims.push({
          a: embResults[i].text.slice(0, 40) + (embResults[i].text.length > 40 ? "..." : ""),
          b: embResults[j].text.slice(0, 40) + (embResults[j].text.length > 40 ? "..." : ""),
          score: Math.round(cosineSimilarity(embResults[i].embedding, embResults[j].embedding) * 10000) / 10000,
        });
      }
    }
    setSimilarities(sims);
    toast.success(`Generated ${embResults.length} embeddings`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Embedding API</h1>
        <p className="text-gray-400">Generate text embeddings and compute similarity</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Model</label>
                <select className="input" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  {embeddingModels.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Dimensions</label>
                <select className="input" value={dimensions} onChange={(e) => setDimensions(Number(e.target.value))}>
                  <option value={256}>256</option>
                  <option value={512}>512</option>
                  <option value={1024}>1024</option>
                  <option value={1536}>1536</option>
                  <option value={3072}>3072</option>
                </select>
              </div>
              <div>
                <label className="label">Input Texts (one per line)</label>
                <textarea className="input" rows={6} value={inputTexts} onChange={(e) => setInputTexts(e.target.value)} />
              </div>
              <button onClick={generateEmbeddings} className="btn-primary w-full justify-center"><Play className="h-4 w-4" /> Generate Embeddings</button>
            </div>
          </div>

          {similarities.length > 0 && (
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold text-gray-300">Cosine Similarity</h3>
              <div className="space-y-2">
                {similarities.map((sim, i) => (
                  <div key={i} className="rounded-lg bg-gray-800/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs text-gray-400">{sim.a}</p>
                        <p className="truncate text-xs text-gray-400">{sim.b}</p>
                      </div>
                      <span className={`ml-3 font-mono text-sm font-bold ${sim.score > 0.5 ? "text-emerald-400" : sim.score > 0 ? "text-yellow-400" : "text-red-400"}`}>
                        {sim.score.toFixed(4)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-700">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(0, (sim.score + 1) / 2 * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {results.length > 0 && (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300">Results ({results.length} embeddings)</h3>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(results.map((r) => r.embedding))); toast.success("Copied"); }} className="btn-secondary text-xs"><Copy className="h-3 w-3" /> Copy All</button>
                </div>
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <div key={i} className="rounded-lg bg-gray-800/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-200 truncate max-w-xs">{r.text}</p>
                        <div className="flex items-center gap-2">
                          <span className="badge-purple"><Hash className="h-3 w-3 mr-1" />{dimensions}d</span>
                          <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(r.embedding)); toast.success("Copied"); }} className="rounded p-1 text-gray-600 hover:text-white">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded bg-gray-900 p-2">
                        <p className="font-mono text-[10px] text-gray-500 truncate">
                          [{r.embedding.slice(0, 8).join(", ")}, ...]
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="mb-3 text-sm font-semibold text-gray-300">Embedding Visualization</h3>
                <div className="grid grid-cols-8 gap-0.5">
                  {results[0]?.embedding.slice(0, 64).map((val, i) => (
                    <div key={i} className="aspect-square rounded-sm" style={{
                      backgroundColor: val > 0
                        ? `rgba(99, 102, 241, ${Math.abs(val)})`
                        : `rgba(239, 68, 68, ${Math.abs(val)})`,
                    }} title={`dim[${i}]: ${val}`} />
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-600">First 64 dimensions (blue=positive, red=negative)</p>
              </div>
            </>
          )}

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Available Embedding Models</h3>
            <div className="space-y-2">
              {embeddingModels.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-200">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.provider} | Context: {m.context_window}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">${m.price_per_1k_input}/1K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
