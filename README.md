# QuickServe

LLM inference gateway and model serving platform with pipeline orchestration, caching, and A/B routing.

## Features

- **Model Management** -- Register and manage multiple LLM models
- **Pipeline Builder** -- Visual pipeline orchestration for chained model calls
- **Function Calling** -- Structured function/tool calling with JSON mode support
- **Response Caching** -- Intelligent caching layer for repeated queries
- **Batch Processing** -- Async batch inference for large-scale workloads
- **Rate Limiting** -- Configurable rate limits per model and API key
- **A/B Routing** -- Split traffic between model variants for experimentation
- **Monitoring Dashboard** -- Real-time metrics, latency tracking, and error rates
- **Embeddings API** -- Vector embedding generation endpoint
- **Grammar-Constrained Output** -- Enforce structured output schemas

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Charts:** Recharts
- **Database:** Supabase (with SSR support)
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone <repository-url>
cd quickserve
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
quickserve/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── models/       # Model management
│   │   ├── pipelines/    # Pipeline orchestration
│   │   ├── caching/      # Cache configuration
│   │   ├── batch/        # Batch processing
│   │   ├── monitoring/   # Metrics dashboard
│   │   └── ab-routing/   # A/B test routing
│   ├── components/       # Shared UI components
│   └── lib/              # Utilities, store, mock data
├── public/               # Static assets
└── package.json
```

## License

MIT
