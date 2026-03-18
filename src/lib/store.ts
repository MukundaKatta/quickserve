import { create } from "zustand";
import type {
  Model,
  Pipeline,
  PipelineStep,
  BatchJob,
  RateLimitRule,
  ABRoute,
  MonitoringMetric,
  FunctionDef,
} from "./supabase";
import { v4 as uuidv4 } from "uuid";

// ---------- seed helpers ----------

function seedModels(): Model[] {
  return [
    {
      id: uuidv4(),
      name: "GPT-4 Turbo",
      provider: "OpenAI",
      type: "text",
      context_window: 128000,
      max_tokens: 4096,
      price_per_1k_input: 0.01,
      price_per_1k_output: 0.03,
      supports_json_mode: true,
      supports_function_calling: true,
      supports_grammar: false,
      supports_caching: true,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      type: "text",
      context_window: 200000,
      max_tokens: 8192,
      price_per_1k_input: 0.003,
      price_per_1k_output: 0.015,
      supports_json_mode: true,
      supports_function_calling: true,
      supports_grammar: true,
      supports_caching: true,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "Llama 3 70B",
      provider: "Meta",
      type: "text",
      context_window: 8192,
      max_tokens: 2048,
      price_per_1k_input: 0.0007,
      price_per_1k_output: 0.0008,
      supports_json_mode: true,
      supports_function_calling: false,
      supports_grammar: true,
      supports_caching: false,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "Mistral Large",
      provider: "Mistral",
      type: "text",
      context_window: 32000,
      max_tokens: 4096,
      price_per_1k_input: 0.004,
      price_per_1k_output: 0.012,
      supports_json_mode: true,
      supports_function_calling: true,
      supports_grammar: true,
      supports_caching: true,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "text-embedding-3-large",
      provider: "OpenAI",
      type: "embedding",
      context_window: 8191,
      max_tokens: 0,
      price_per_1k_input: 0.00013,
      price_per_1k_output: 0,
      supports_json_mode: false,
      supports_function_calling: false,
      supports_grammar: false,
      supports_caching: true,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "Gemini 1.5 Pro",
      provider: "Google",
      type: "text",
      context_window: 1000000,
      max_tokens: 8192,
      price_per_1k_input: 0.0035,
      price_per_1k_output: 0.014,
      supports_json_mode: true,
      supports_function_calling: true,
      supports_grammar: false,
      supports_caching: true,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "Cohere Embed v3",
      provider: "Cohere",
      type: "embedding",
      context_window: 512,
      max_tokens: 0,
      price_per_1k_input: 0.0001,
      price_per_1k_output: 0,
      supports_json_mode: false,
      supports_function_calling: false,
      supports_grammar: false,
      supports_caching: false,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "DALL-E 3",
      provider: "OpenAI",
      type: "image",
      context_window: 4000,
      max_tokens: 0,
      price_per_1k_input: 0.04,
      price_per_1k_output: 0,
      supports_json_mode: false,
      supports_function_calling: false,
      supports_grammar: false,
      supports_caching: false,
      status: "active",
      created_at: new Date().toISOString(),
    },
  ];
}

function seedMetrics(models: Model[]): MonitoringMetric[] {
  const metrics: MonitoringMetric[] = [];
  const now = Date.now();
  for (const model of models.slice(0, 4)) {
    for (let i = 23; i >= 0; i--) {
      metrics.push({
        timestamp: new Date(now - i * 3600000).toISOString(),
        model_id: model.id,
        requests: Math.floor(Math.random() * 5000) + 500,
        avg_latency_ms: Math.floor(Math.random() * 400) + 100,
        p99_latency_ms: Math.floor(Math.random() * 1500) + 500,
        error_rate: Math.random() * 0.05,
        tokens_used: Math.floor(Math.random() * 500000) + 50000,
        cache_hit_rate: Math.random() * 0.6 + 0.2,
      });
    }
  }
  return metrics;
}

// ---------- store ----------

interface AppState {
  models: Model[];
  pipelines: Pipeline[];
  batchJobs: BatchJob[];
  rateLimits: RateLimitRule[];
  abRoutes: ABRoute[];
  metrics: MonitoringMetric[];

  // model actions
  addModel: (m: Omit<Model, "id" | "created_at">) => void;
  deleteModel: (id: string) => void;

  // pipeline actions
  addPipeline: (name: string, description: string) => Pipeline;
  updatePipeline: (id: string, p: Partial<Pipeline>) => void;
  deletePipeline: (id: string) => void;
  addPipelineStep: (pipelineId: string, step: Omit<PipelineStep, "id" | "position">) => void;
  removePipelineStep: (pipelineId: string, stepId: string) => void;
  updatePipelineStep: (pipelineId: string, stepId: string, s: Partial<PipelineStep>) => void;

  // batch
  createBatchJob: (job: Omit<BatchJob, "id" | "created_at" | "completed_at" | "status" | "completed_requests" | "failed_requests">) => void;
  updateBatchJob: (id: string, j: Partial<BatchJob>) => void;

  // rate limits
  addRateLimit: (r: Omit<RateLimitRule, "id">) => void;
  updateRateLimit: (id: string, r: Partial<RateLimitRule>) => void;
  deleteRateLimit: (id: string) => void;

  // a/b routes
  addABRoute: (r: Omit<ABRoute, "id" | "created_at" | "metrics">) => void;
  updateABRoute: (id: string, r: Partial<ABRoute>) => void;
  deleteABRoute: (id: string) => void;
}

const initialModels = seedModels();

export const useStore = create<AppState>((set, get) => ({
  models: initialModels,
  pipelines: [
    {
      id: uuidv4(),
      name: "RAG Pipeline",
      description: "Retrieval-augmented generation with embedding search and answer synthesis",
      steps: [
        {
          id: uuidv4(),
          model_id: initialModels[4].id,
          model_name: initialModels[4].name,
          prompt_template: "Embed the following query for semantic search: {{query}}",
          input_mapping: { query: "user_input" },
          output_key: "embedding",
          position: 0,
          config: { temperature: 0, max_tokens: 0, json_mode: false, cache_enabled: true },
        },
        {
          id: uuidv4(),
          model_id: initialModels[0].id,
          model_name: initialModels[0].name,
          prompt_template:
            "Given the following context:\n{{context}}\n\nAnswer the question: {{query}}\n\nProvide a detailed answer with citations.",
          input_mapping: { context: "retrieved_docs", query: "user_input" },
          output_key: "answer",
          position: 1,
          config: { temperature: 0.3, max_tokens: 2048, json_mode: false, cache_enabled: true },
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: "Structured Extraction",
      description: "Extract structured JSON data from unstructured text",
      steps: [
        {
          id: uuidv4(),
          model_id: initialModels[1].id,
          model_name: initialModels[1].name,
          prompt_template:
            'Extract the following fields from the text:\n- name\n- email\n- company\n- role\n\nText: {{text}}\n\nReturn valid JSON.',
          input_mapping: { text: "user_input" },
          output_key: "extracted",
          position: 0,
          config: { temperature: 0, max_tokens: 1024, json_mode: true, cache_enabled: false },
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  batchJobs: [
    {
      id: uuidv4(),
      pipeline_id: null,
      model_id: initialModels[0].id,
      status: "completed",
      total_requests: 1000,
      completed_requests: 987,
      failed_requests: 13,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      completed_at: new Date(Date.now() - 82800000).toISOString(),
    },
    {
      id: uuidv4(),
      pipeline_id: null,
      model_id: initialModels[1].id,
      status: "running",
      total_requests: 5000,
      completed_requests: 3241,
      failed_requests: 22,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: null,
    },
  ],
  rateLimits: [
    {
      id: uuidv4(),
      name: "Default Tier",
      model_id: null,
      requests_per_minute: 60,
      tokens_per_minute: 100000,
      concurrent_requests: 10,
      enabled: true,
    },
    {
      id: uuidv4(),
      name: "Premium Tier",
      model_id: null,
      requests_per_minute: 300,
      tokens_per_minute: 500000,
      concurrent_requests: 50,
      enabled: true,
    },
  ],
  abRoutes: [
    {
      id: uuidv4(),
      name: "GPT-4 vs Claude Sonnet",
      model_a_id: initialModels[0].id,
      model_b_id: initialModels[1].id,
      model_a_name: initialModels[0].name,
      model_b_name: initialModels[1].name,
      traffic_split: 50,
      metrics: { a_latency: 320, b_latency: 280, a_quality: 0.92, b_quality: 0.94 },
      status: "active",
      created_at: new Date().toISOString(),
    },
  ],
  metrics: seedMetrics(initialModels),

  // --- model actions ---
  addModel: (m) =>
    set((s) => ({
      models: [...s.models, { ...m, id: uuidv4(), created_at: new Date().toISOString() }],
    })),
  deleteModel: (id) => set((s) => ({ models: s.models.filter((m) => m.id !== id) })),

  // --- pipeline actions ---
  addPipeline: (name, description) => {
    const p: Pipeline = {
      id: uuidv4(),
      name,
      description,
      steps: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((s) => ({ pipelines: [...s.pipelines, p] }));
    return p;
  },
  updatePipeline: (id, p) =>
    set((s) => ({
      pipelines: s.pipelines.map((x) =>
        x.id === id ? { ...x, ...p, updated_at: new Date().toISOString() } : x
      ),
    })),
  deletePipeline: (id) => set((s) => ({ pipelines: s.pipelines.filter((p) => p.id !== id) })),
  addPipelineStep: (pipelineId, step) =>
    set((s) => ({
      pipelines: s.pipelines.map((p) => {
        if (p.id !== pipelineId) return p;
        const newStep: PipelineStep = { ...step, id: uuidv4(), position: p.steps.length };
        return { ...p, steps: [...p.steps, newStep], updated_at: new Date().toISOString() };
      }),
    })),
  removePipelineStep: (pipelineId, stepId) =>
    set((s) => ({
      pipelines: s.pipelines.map((p) => {
        if (p.id !== pipelineId) return p;
        const steps = p.steps
          .filter((st) => st.id !== stepId)
          .map((st, i) => ({ ...st, position: i }));
        return { ...p, steps, updated_at: new Date().toISOString() };
      }),
    })),
  updatePipelineStep: (pipelineId, stepId, s) =>
    set((state) => ({
      pipelines: state.pipelines.map((p) => {
        if (p.id !== pipelineId) return p;
        return {
          ...p,
          steps: p.steps.map((st) => (st.id === stepId ? { ...st, ...s } : st)),
          updated_at: new Date().toISOString(),
        };
      }),
    })),

  // --- batch ---
  createBatchJob: (job) =>
    set((s) => ({
      batchJobs: [
        ...s.batchJobs,
        {
          ...job,
          id: uuidv4(),
          status: "pending",
          completed_requests: 0,
          failed_requests: 0,
          created_at: new Date().toISOString(),
          completed_at: null,
        },
      ],
    })),
  updateBatchJob: (id, j) =>
    set((s) => ({ batchJobs: s.batchJobs.map((b) => (b.id === id ? { ...b, ...j } : b)) })),

  // --- rate limits ---
  addRateLimit: (r) => set((s) => ({ rateLimits: [...s.rateLimits, { ...r, id: uuidv4() }] })),
  updateRateLimit: (id, r) =>
    set((s) => ({ rateLimits: s.rateLimits.map((x) => (x.id === id ? { ...x, ...r } : x)) })),
  deleteRateLimit: (id) =>
    set((s) => ({ rateLimits: s.rateLimits.filter((r) => r.id !== id) })),

  // --- a/b routes ---
  addABRoute: (r) =>
    set((s) => ({
      abRoutes: [
        ...s.abRoutes,
        {
          ...r,
          id: uuidv4(),
          created_at: new Date().toISOString(),
          metrics: { a_latency: 0, b_latency: 0, a_quality: 0, b_quality: 0 },
        },
      ],
    })),
  updateABRoute: (id, r) =>
    set((s) => ({ abRoutes: s.abRoutes.map((x) => (x.id === id ? { ...x, ...r } : x)) })),
  deleteABRoute: (id) => set((s) => ({ abRoutes: s.abRoutes.filter((r) => r.id !== id) })),
}));
