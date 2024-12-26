import { Message } from "@/types/conversation";

export interface MessageListProps {
  messages: Message[];
  streamingState: {
    id: string | null;
    isStreaming: boolean;
    content: string;
  };
  error?: string | null;
}