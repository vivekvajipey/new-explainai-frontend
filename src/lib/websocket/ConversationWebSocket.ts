import { BaseWebSocket } from '@/lib/api';

interface MessageResponse {
  message: string;
  created_at: string;
  role: 'user' | 'assistant' | 'system';
  id: string;
}

interface MessagesResponse {
  messages: MessageResponse[];
}

export class ConversationWebSocket extends BaseWebSocket {
  private conversationId: string | null = null;

  constructor(documentId: string) {
    super(documentId, '/conversations/stream');
  }

  async createMainConversation(): Promise<string> {
    await this.waitForConnection();
    
    return new Promise((resolve, reject) => {
      const handler = (data: { conversation_id: string }) => {
        if (data.conversation_id) {
          this.conversationId = data.conversation_id;
          resolve(data.conversation_id);
        } else {
          reject(new Error('Invalid response from server'));
        }
        this.off('conversation.main.create.completed', handler);
      };

      const errorHandler = (error: { message: string }) => {
        reject(new Error(error.message || 'Failed to create conversation'));
        this.off('conversation.main.create.error', errorHandler);
      };

      this.onMessage('conversation.main.create.completed', handler);
      this.onMessage('conversation.main.create.error', errorHandler);

      this.send('conversation.main.create', {
        document_id: this.documentId
      });

      // Set timeout
      setTimeout(() => {
        this.off('conversation.main.create.completed', handler);
        this.off('conversation.main.create.error', errorHandler);
        reject(new Error('Timeout creating conversation'));
      }, 10000);
    });
  }

  async sendMessage(content: string, chunkId?: string): Promise<void> {
    if (!this.conversationId) {
      throw new Error('No active conversation');
    }

    await this.waitForConnection();

    return new Promise((resolve, reject) => {
      const handler = (data: { message: string }) => {
        resolve();
        this.off('conversation.message.send.completed', handler);
        this.off('conversation.message.send.error', errorHandler);
      };

      const errorHandler = (error: { message: string }) => {
        reject(new Error(error.message || 'Failed to send message'));
        this.off('conversation.message.send.completed', handler);
        this.off('conversation.message.send.error', errorHandler);
      };

      this.onMessage('conversation.message.send.completed', handler);
      this.onMessage('conversation.message.send.error', errorHandler);

      this.send('conversation.message.send', {
        conversation_id: this.conversationId,
        content,
        chunk_id: chunkId || "0" // Default to chunk 0 for main conversation
      });

      setTimeout(() => {
        this.off('conversation.message.send.completed', handler);
        this.off('conversation.message.send.error', errorHandler);
        reject(new Error('Timeout sending message'));
      }, 30000); // Increased to 30 seconds for message sending
    });
  }

  async getMessages(conversationId: string): Promise<MessagesResponse> {
    await this.waitForConnection();

    return new Promise((resolve, reject) => {
      const handler = (data: MessagesResponse) => {
        resolve(data);
        this.off('conversation.messages.get.completed', handler);
        this.off('conversation.messages.get.error', errorHandler);
      };

      const errorHandler = (error: { message: string }) => {
        reject(new Error(error.message || 'Failed to get messages'));
        this.off('conversation.messages.get.completed', handler);
        this.off('conversation.messages.get.error', errorHandler);
      };

      this.onMessage('conversation.messages.get.completed', handler);
      this.onMessage('conversation.messages.get.error', errorHandler);

      this.send('conversation.messages.get', {
        conversation_id: conversationId
      });

      // Short timeout since missing messages is not an error
      setTimeout(() => {
        this.off('conversation.messages.get.completed', handler);
        this.off('conversation.messages.get.error', errorHandler);
        reject(new Error('No messages yet'));
      }, 5000); // 5 seconds is plenty for initial fetch
    });
  }

  close() {
    super.close();
    this.conversationId = null;
  }
} 