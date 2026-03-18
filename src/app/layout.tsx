import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "QuickServe - AI Model Serving Platform",
  description: "Fast AI model serving with compound pipelines, function calling, and more",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1f2937", color: "#f3f4f6", border: "1px solid #374151" },
          }}
        />
      </body>
    </html>
  );
}
