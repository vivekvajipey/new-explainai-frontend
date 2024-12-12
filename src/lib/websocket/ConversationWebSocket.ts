import { BaseWebSocket } from '@/lib/api';
import {
  ConversationResponse,
  ChunkConversationsResponse,
  WebSocketError,
  MessageHandler,
  ConversationCreateCompleted,
  ConversationCreateError,
  ConversationMessageSendCompleted,
  ConversationMessagesCompleted,
  ConversationChunkGetCompleted
} from './types';

export class ConversationWebSocket extends BaseWebSocket {
  private eventHandlers: Map<string, MessageHandler<unknown>> = new Map();

  constructor(documentId: string) {
    super(documentId, '/conversations/stream');
  }

  async createMainConversation(): Promise<string> {
    await this.waitForConnection();
    
    return new Promise((resolve, reject) => {
      const handler: MessageHandler<ConversationCreateCompleted> = (data) => {
        resolve(data.conversation_id);
        this.off<ConversationCreateCompleted>('conversation.main.create.completed', handler);
        this.off<ConversationCreateError>('conversation.main.create.error', errorHandler);
      };

      const errorHandler: MessageHandler<ConversationCreateError> = (error) => {
        reject(new Error(error.message || 'Failed to create conversation'));
        this.off<ConversationCreateCompleted>('conversation.main.create.completed', handler);
        this.off<ConversationCreateError>('conversation.main.create.error', errorHandler);
      };

      this.onMessage<ConversationCreateCompleted>('conversation.main.create.completed', handler);
      this.onMessage<ConversationCreateError>('conversation.main.create.error', errorHandler);

      this.send('conversation.main.create', {
        document_id: this.documentId
      });

      setTimeout(() => {
        this.off<ConversationCreateCompleted>('conversation.main.create.completed', handler);
        this.off<ConversationCreateError>('conversation.main.create.error', errorHandler);
        reject(new Error('Timeout creating conversation'));
      }, 10000);
    });
  }

  async createChunkConversation(chunkId: string, highlightText: string): Promise<string> {
    await this.waitForConnection();
    
    return new Promise((resolve, reject) => {
      const handler: MessageHandler<ConversationCreateCompleted> = (data) => {
        resolve(data.conversation_id);
        this.off<ConversationCreateCompleted>('conversation.chunk.create.completed', handler);
        this.off<ConversationCreateError>('conversation.chunk.create.error', errorHandler);
      };

      const errorHandler: MessageHandler<ConversationCreateError> = (error) => {
        reject(new Error(error.message || 'Failed to create chunk conversation'));
        this.off<ConversationCreateCompleted>('conversation.chunk.create.completed', handler);
        this.off<ConversationCreateError>('conversation.chunk.create.error', errorHandler);
      };

      this.onMessage<ConversationCreateCompleted>('conversation.chunk.create.completed', handler);
      this.onMessage<ConversationCreateError>('conversation.chunk.create.error', errorHandler);

      this.send('conversation.chunk.create', {
        document_id: this.documentId,
        chunk_id: chunkId,
        highlight_text: highlightText
      });

      setTimeout(() => {
        this.off<ConversationCreateCompleted>('conversation.chunk.create.completed', handler);
        this.off<ConversationCreateError>('conversation.chunk.create.error', errorHandler);
        reject(new Error('Timeout creating chunk conversation'));
      }, 10000);
    });
  }

  async sendMessage(conversationId: string, content: string, chunkId?: string): Promise<void> {
    await this.waitForConnection();

    return new Promise((resolve, reject) => {
      const handler: MessageHandler<ConversationMessageSendCompleted> = () => {
        resolve();
        this.off<ConversationMessageSendCompleted>('conversation.message.send.completed', handler);
        this.off<WebSocketError>('conversation.message.send.error', errorHandler);
      };

      const errorHandler: MessageHandler<WebSocketError> = (error) => {
        reject(new Error(error.message || 'Failed to send message'));
        this.off<ConversationMessageSendCompleted>('conversation.message.send.completed', handler);
        this.off<WebSocketError>('conversation.message.send.error', errorHandler);
      };

      this.onMessage<ConversationMessageSendCompleted>('conversation.message.send.completed', handler);
      this.onMessage<WebSocketError>('conversation.message.send.error', errorHandler);

      const messageData = {
        conversation_id: conversationId,
        content,
        ...(chunkId && { chunk_id: chunkId })
      };
  
      this.send('conversation.message.send', messageData);

      setTimeout(() => {
        this.off<ConversationMessageSendCompleted>('conversation.message.send.completed', handler);
        this.off<WebSocketError>('conversation.message.send.error', errorHandler);
        reject(new Error('Timeout sending message'));
      }, 30000);
    });
  }

  async getMessages(conversationId: string): Promise<ConversationResponse> {
    await this.waitForConnection();

    return new Promise((resolve, reject) => {
      const handler: MessageHandler<ConversationMessagesCompleted> = (data) => {
        const transformedData: ConversationResponse = {
          conversation_id: data.conversation_id,
          messages: data.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.message,
            timestamp: msg.created_at
          }))
        };
        
        resolve(transformedData);
        this.off<ConversationMessagesCompleted>('conversation.messages.completed', handler);
        this.off<WebSocketError>('conversation.messages.error', errorHandler);
      };

      const errorHandler: MessageHandler<WebSocketError> = (error) => {
        reject(new Error(error.message || 'Failed to get messages'));
        this.off<ConversationMessagesCompleted>('conversation.messages.completed', handler);
        this.off<WebSocketError>('conversation.messages.error', errorHandler);
      };

      this.onMessage<ConversationMessagesCompleted>('conversation.messages.completed', handler);
      this.onMessage<WebSocketError>('conversation.messages.error', errorHandler);

      this.send('conversation.messages.list', {
        conversation_id: conversationId
      });

      setTimeout(() => {
        this.off<ConversationMessagesCompleted>('conversation.messages.completed', handler);
        this.off<WebSocketError>('conversation.messages.error', errorHandler);
        reject(new Error('No messages yet'));
      }, 5000);
    });
  }

  async getChunkConversations(chunkId: string): Promise<ChunkConversationsResponse> {
    await this.waitForConnection();

    return new Promise((resolve, reject) => {
      const handler: MessageHandler<ConversationChunkGetCompleted> = (data) => {
        resolve(data);
        this.off<ConversationChunkGetCompleted>('conversation.chunk.get.completed', handler);
        this.off<WebSocketError>('conversation.chunk.get.error', errorHandler);
      };

      const errorHandler: MessageHandler<WebSocketError> = (error) => {
        reject(new Error(error.message || 'Failed to get conversations'));
        this.off<ConversationChunkGetCompleted>('conversation.chunk.get.completed', handler);
        this.off<WebSocketError>('conversation.chunk.get.error', errorHandler);
      };

      this.onMessage<ConversationChunkGetCompleted>('conversation.chunk.get.completed', handler);
      this.onMessage<WebSocketError>('conversation.chunk.get.error', errorHandler);

      this.send('conversation.get.by.sequence', {
        sequence_number: chunkId
      });

      setTimeout(() => {
        this.off<ConversationChunkGetCompleted>('conversation.chunk.get.completed', handler);
        this.off<WebSocketError>('conversation.chunk.get.error', errorHandler);
        reject(new Error('Timeout getting conversations'));
      }, 5000);
    });
  }

  onMessage<T>(event: string, handler: MessageHandler<T>): void {
    this.eventHandlers.set(event, handler as MessageHandler<unknown>);
  }

  off<T>(event: string, handler: MessageHandler<T>): void {
    const currentHandler = this.eventHandlers.get(event);
    if (currentHandler === (handler as MessageHandler<unknown>)) {
      this.eventHandlers.delete(event);
    }
  }

  close() {
    super.close();
  }
} 