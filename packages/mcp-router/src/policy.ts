export type ToolAccess = "read" | "write" | "blocked";

export interface ToolPolicy {
  server: string;
  tool: string;
  access: ToolAccess;
}

export function mayCall(policy: ToolPolicy, mode: "read_only" | "edit"): boolean {
  if (policy.access === "blocked") return false;
  if (policy.access === "write" && mode !== "edit") return false;
  return true;
}
