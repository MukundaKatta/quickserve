import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Model = {
  id: string;
  name: string;
  provider: string;
  type: "text" | "embedding" | "image" | "audio";
  context_window: number;
  max_tokens: number;
  price_per_1k_input: number;
  price_per_1k_output: number;
  supports_json_mode: boolean;
  supports_function_calling: boolean;
  supports_grammar: boolean;
  supports_caching: boolean;
  status: "active" | "deprecated" | "beta";
  created_at: string;
};

export type Pipeline = {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  created_at: string;
  updated_at: string;
};

export type PipelineStep = {
  id: string;
  model_id: string;
  model_name: string;
  prompt_template: string;
  input_mapping: Record<string, string>;
  output_key: string;
  position: number;
  config: StepConfig;
};

export type StepConfig = {
  temperature: number;
  max_tokens: number;
  json_mode: boolean;
  grammar?: string;
  cache_enabled: boolean;
  functions?: FunctionDef[];
};

export type FunctionDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type BatchJob = {
  id: string;
  pipeline_id: string | null;
  model_id: string;
  status: "pending" | "running" | "completed" | "failed";
  total_requests: number;
  completed_requests: number;
  failed_requests: number;
  created_at: string;
  completed_at: string | null;
};

export type RateLimitRule = {
  id: string;
  name: string;
  model_id: string | null;
  requests_per_minute: number;
  tokens_per_minute: number;
  concurrent_requests: number;
  enabled: boolean;
};

export type ABRoute = {
  id: string;
  name: string;
  model_a_id: string;
  model_b_id: string;
  model_a_name: string;
  model_b_name: string;
  traffic_split: number;
  metrics: { a_latency: number; b_latency: number; a_quality: number; b_quality: number };
  status: "active" | "paused";
  created_at: string;
};

export type MonitoringMetric = {
  timestamp: string;
  model_id: string;
  requests: number;
  avg_latency_ms: number;
  p99_latency_ms: number;
  error_rate: number;
  tokens_used: number;
  cache_hit_rate: number;
};
