"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  GitBranch,
  FunctionSquare,
  Braces,
  Database,
  Layers,
  Gauge,
  Activity,
  GitCompare,
  Hash,
  ShieldCheck,
  Zap,
} from "lucide-react";

const nav = [
  { label: "Dashboard", href: "/", icon: Activity },
  { label: "Model Catalog", href: "/models", icon: Boxes },
  { label: "Pipelines", href: "/pipelines", icon: GitBranch },
  { label: "Pipeline Builder", href: "/pipeline-builder", icon: Layers },
  { label: "Function Calling", href: "/functions", icon: FunctionSquare },
  { label: "JSON Mode", href: "/json-mode", icon: Braces },
  { label: "Prompt Caching", href: "/caching", icon: Database },
  { label: "Batch Inference", href: "/batch", icon: Hash },
  { label: "Rate Limiting", href: "/rate-limits", icon: ShieldCheck },
  { label: "Monitoring", href: "/monitoring", icon: Gauge },
  { label: "A/B Routing", href: "/ab-routing", icon: GitCompare },
  { label: "Embeddings", href: "/embeddings", icon: Zap },
  { label: "Grammar Gen", href: "/grammar", icon: Braces },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-900/50">
      <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">QuickServe</h1>
          <p className="text-[10px] text-gray-500">AI Model Serving</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-brand-600/20 text-brand-400"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600" />
          <div>
            <p className="text-sm font-medium text-gray-200">Admin</p>
            <p className="text-xs text-gray-500">Platform Owner</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
