export interface BridgeConfig {
  host: "127.0.0.1" | string;
  port: number;
  authToken: string;
  mode: "read_only" | "edit";
}

export function assertSafeDefault(config: BridgeConfig): void {
  if (!config.authToken || config.authToken === "CHANGE_ME") {
    throw new Error("BRIDGE_AUTH_TOKEN must be generated locally");
  }
  if (config.host !== "127.0.0.1") {
    throw new Error("Non-loopback bind requires an explicit security review");
  }
}
