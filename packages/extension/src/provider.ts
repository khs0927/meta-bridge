export interface ProviderAdapter {
  readonly id: string;
  matches(url: URL): boolean;
  healthCheck(): Promise<{ ok: boolean; detail?: string }>;
  readLatestAssistantMessage(): Promise<string | null>;
  submitUserVisibleText(text: string): Promise<void>;
}
