// new-explainai-frontend/src/lib/websocket/ConversationWebSocket.ts

import { 
  ConversationResponse,
  ChunkConversationsResponse,
  WebSocketError,
  MessageHandler,
  ConversationCreateCompleted,
  ConversationCreateError,
  ConversationMessageSendCompleted,
  ConversationMessagesCompleted,
  ConversationChunkGetCompleted,
} from './types';

const WS_BASE_URL = 'ws://localhost:8000/api';

export class ConversationWebSocket {
  private ws: WebSocket | null = null;
  private eventHandlers = new Map<string, Set<MessageHandler<unknown>>>();
  private pendingMessages: { type: string; data: unknown }[] = [];
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 2;
  private readonly reconnectDelay = 1000;

  constructor(private readonly documentId: string) {
    console.log('ConversationWebSocket: Initializing for document', documentId);
    this.connectionPromise = this.connect();
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('ConversationWebSocket: Connecting...');
      this.ws = new WebSocket(`${WS_BASE_URL}/conversations/stream/${this.documentId}`);

      // Connection timeout
      const timeoutId = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.error('ConversationWebSocket: Connection timeout');
          this.ws?.close();
          reject(new Error('Connection timeout'));
          this.handleReconnect();
        }
      }, 5000);

      this.ws.onopen = () => {
        console.log('ConversationWebSocket: Connected');
        clearTimeout(timeoutId);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
        this.processPendingMessages();
      };

      this.ws.onclose = () => {
        console.log('ConversationWebSocket: Connection closed');
        this.isConnected = false;
        this.ws = null;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('ConversationWebSocket: Connection error', error);
        clearTimeout(timeoutId);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data, error } = message;

          console.log('ConversationWebSocket: Received message', { type, data, error });

          if (error) {
            const errorHandlers = this.eventHandlers.get(`${type}.error`);
            if (errorHandlers) {
              errorHandlers.forEach(handler => handler(error));
            }
            return;
          }

          const handlers = this.eventHandlers.get(type);
          if (handlers && handlers.size > 0) {
            handlers.forEach(handler => handler(data));
          } else {
            console.log('ConversationWebSocket: Queueing message for', type);
            this.pendingMessages.push({ type, data });
          }
        } catch (error) {
          console.error('ConversationWebSocket: Failed to process message', error);
        }
      };
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('ConversationWebSocket: Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`ConversationWebSocket: Attempting to reconnect in ${delay}ms...`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connectionPromise = this.connect();
    }, delay);
  }

  private send(type: string, data: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = JSON.stringify({ type, data });
    console.log('ConversationWebSocket: Sending', message);
    this.ws.send(message);
  }

  private onMessage<T>(event: string, handler: MessageHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler as MessageHandler<unknown>);
    console.log('ConversationWebSocket: Registered handler for', event);
  }

  public removeHandler<T>(event: string, handler: MessageHandler<T>): void {
    this.eventHandlers.get(event)?.delete(handler as MessageHandler<unknown>);
    if (this.eventHandlers.get(event)?.size === 0) {
      this.eventHandlers.delete(event);
    }
  }

  private processPendingMessages(): void {
    console.log('ConversationWebSocket: Processing pending messages:', this.pendingMessages.length);
    this.pendingMessages.forEach(message => {
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => handler(message.data));
      }
    });
    this.pendingMessages = [];
  }

  private async waitForConnection(): Promise<void> {
    if (this.isConnected) return;
    await this.connectionPromise;
  }

  // Public API methods
  async createMainConversation(): Promise<string> {
    await this.waitForConnection();
    
    return new Promise((resolve, reject) => {
      const handler: MessageHandler<ConversationCreateCompleted> = (data) => {
        resolve(data.conversation_id);
        this.removeHandler('conversation.main.create.completed', handler);
        this.removeHandler('conversation.main.create.error', errorHandler);
      };

      const errorHandler: MessageHandler<ConversationCreateError> = (error) => {
        reject(new Error(error.message || 'Failed to create conversation'));
        this.removeHandler('conversation.main.create.completed', handler);
        this.removeHandler('conversation.main.create.error', errorHandler);
      };

      this.onMessage('conversation.main.create.completed', handler);
      this.onMessage('conversation.main.create.error', errorHandler);

      this.send('conversation.main.create', {
        document_id: this.documentId
      });

      setTimeout(() => {
        this.removeHandler('conversation.main.create.completed', handler);
        this.removeHandler('conversation.main.create.error', errorHandler);
        reject(new Error('Timeout creating conversation'));
      }, 10000);
    });
  }

  async createChunkConversation(chunkId: string, highlightText: string): Promise<string> {
    await this.waitForConnection();
    
    return new Promise((resolve, reject) => {
      const handler: MessageHandler<ConversationCreateCompleted> = (data) => {
        resolve(data.conversation_id);
        this.removeHandler<ConversationCreateCompleted>('conversation.chunk.create.completed', handler);
        this.removeHandler<ConversationCreateError>('conversation.chunk.create.error', errorHandler);
      };

      const errorHandler: MessageHandler<ConversationCreateError> = (error) => {
        reject(new Error(error.message || 'Failed to create chunk conversation'));
        this.removeHandler<ConversationCreateCompleted>('conversation.chunk.create.completed', handler);
        this.removeHandler<ConversationCreateError>('conversation.chunk.create.error', errorHandler);
      };

      this.onMessage<ConversationCreateCompleted>('conversation.chunk.create.completed', handler);
      this.onMessage<ConversationCreateError>('conversation.chunk.create.error', errorHandler);

      this.send('conversation.chunk.create', {
        document_id: this.documentId,
        chunk_id: chunkId,
        highlight_text: highlightText
      });

      setTimeout(() => {
        this.removeHandler<ConversationCreateCompleted>('conversation.chunk.create.completed', handler);
        this.removeHandler<ConversationCreateError>('conversation.chunk.create.error', errorHandler);
        reject(new Error('Timeout creating chunk conversation'));
      }, 10000);
    });
  }

  async sendMessage(conversationId: string, content: string, chunkId?: string, conversationType?: string): Promise<ConversationMessageSendCompleted> {
    await this.waitForConnection();

    return new Promise((resolve, reject) => {
      const handler: MessageHandler<ConversationMessageSendCompleted> = (data) => {
        resolve(data);
        this.removeHandler<ConversationMessageSendCompleted>('conversation.message.send.completed', handler);
        this.removeHandler<WebSocketError>('conversation.message.send.error', errorHandler);
      };

      const errorHandler: MessageHandler<WebSocketError> = (error) => {
        reject(new Error(error.message || 'Failed to send message'));
        this.removeHandler<ConversationMessageSendCompleted>('conversation.message.send.completed', handler);
        this.removeHandler<WebSocketError>('conversation.message.send.error', errorHandler);
      };

      this.onMessage<ConversationMessageSendCompleted>('conversation.message.send.completed', handler);
      this.onMessage<WebSocketError>('conversation.message.send.error', errorHandler);

      this.send('conversation.message.send', {
        conversation_id: conversationId,
        content: content,
        chunk_id: chunkId,
        conversation_type: conversationType
      });

      setTimeout(() => {
        this.removeHandler<ConversationMessageSendCompleted>('conversation.message.send.completed', handler);
        this.removeHandler<WebSocketError>('conversation.message.send.error', errorHandler);
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
      };

      const errorHandler: MessageHandler<WebSocketError> = (error) => {
        reject(new Error(error.message || 'Failed to get messages'));
      };

      this.onMessage('conversation.messages.completed', handler);
      this.onMessage('conversation.messages.error', errorHandler);

      this.send('conversation.messages.list', {
        conversation_id: conversationId
      });
    });
  }

  async getChunkConversations(chunkId: string): Promise<ChunkConversationsResponse> {
    await this.waitForConnection();

    return new Promise((resolve, reject) => {
      const handler: MessageHandler<ConversationChunkGetCompleted> = (data) => {
        resolve(data);
        this.removeHandler<ConversationChunkGetCompleted>('conversation.chunk.get.completed', handler);
        this.removeHandler<WebSocketError>('conversation.chunk.get.error', errorHandler);
      };

      const errorHandler: MessageHandler<WebSocketError> = (error) => {
        reject(new Error(error.message || 'Failed to get conversations'));
        this.removeHandler<ConversationChunkGetCompleted>('conversation.chunk.get.completed', handler);
        this.removeHandler<WebSocketError>('conversation.chunk.get.error', errorHandler);
      };

      this.onMessage<ConversationChunkGetCompleted>('conversation.chunk.get.completed', handler);
      this.onMessage<WebSocketError>('conversation.chunk.get.error', errorHandler);

      this.send('conversation.get.by.sequence', {
        sequence_number: chunkId
      });

      setTimeout(() => {
        this.removeHandler<ConversationChunkGetCompleted>('conversation.chunk.get.completed', handler);
        this.removeHandler<WebSocketError>('conversation.chunk.get.error', errorHandler);
        reject(new Error('Timeout getting conversations'));
      }, 5000);
    });
  }

  close(): void {
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
    this.pendingMessages = [];
    this.isConnected = false;
  }
}