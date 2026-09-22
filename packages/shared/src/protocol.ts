export type BridgeMode = "read_only" | "edit";

export interface ToolCallEnvelope {
  version: 1;
  requestId: string;
  sessionId: string;
  method: "tools/list" | "tools/call";
  params: Record<string, unknown>;
}

export interface BridgeError {
  code: string;
  message: string;
  retryable?: boolean;
}
