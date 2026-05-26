import type { ShenuteProvider } from "@/features/shenute/shared";

export const SHENUTE_HANDOFF_STORAGE_KEY =
  "coptic-compass:shenute-floating-handoff";

export type ShenuteHandoffProvider = ShenuteProvider;

export type ShenuteHandoffMessage = {
  content: string;
  id: string;
  parts?: Array<{ text: string; type: "text" }>;
  role: "assistant" | "system" | "user";
};

export type ShenuteHandoffPageContext = {
  excerpt: string;
  path: string;
  title: string;
  url: string;
};

export type ShenuteHandoffPayload = {
  createdAt: string;
  inferenceProvider: ShenuteHandoffProvider;
  messages: ShenuteHandoffMessage[];
  pageContext: ShenuteHandoffPageContext;
  source: "floating";
};
