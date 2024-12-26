export interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  placeholder: string;
  disabled?: boolean;
}