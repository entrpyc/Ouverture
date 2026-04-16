export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface AIAdapter {
  chat(messages: AIMessage[]): Promise<ReadableStream>;
  complete<T>(messages: AIMessage[]): Promise<T>;
}
