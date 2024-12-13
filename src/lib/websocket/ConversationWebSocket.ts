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

    // Process any pending messages for this handler
    const matchingMessages = this.pendingMessages.filter(msg => msg.type === event);
    matchingMessages.forEach(msg => {
      handler(msg.data as T);
      this.pendingMessages = this.pendingMessages.filter(m => m !== msg);
    });
  }

  private off<T>(event: string, handler: MessageHandler<T>): void {
    this.eventHandlers.get(event)?.delete(handler as MessageHandler<unknown>);
    if (this.eventHandlers.get(event)?.size === 0) {
      this.eventHandlers.delete(event);
    }
    console.log('ConversationWebSocket: Removed handler for', event);
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
        this.off('conversation.main.create.completed', handler);
        this.off('conversation.main.create.error', errorHandler);
      };

      const errorHandler: MessageHandler<ConversationCreateError> = (error) => {
        reject(new Error(error.message || 'Failed to create conversation'));
        this.off('conversation.main.create.completed', handler);
        this.off('conversation.main.create.error', errorHandler);
      };

      this.onMessage('conversation.main.create.completed', handler);
      this.onMessage('conversation.main.create.error', errorHandler);

      this.send('conversation.main.create', {
        document_id: this.documentId
      });

      setTimeout(() => {
        this.off('conversation.main.create.completed', handler);
        this.off('conversation.main.create.error', errorHandler);
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

      this.send('conversation.message.send', {
        conversation_id: conversationId,
        content,
        ...(chunkId && { chunk_id: chunkId })
      });

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
      let isResolved = false;

      const handler: MessageHandler<ConversationMessagesCompleted> = (data) => {
        if (isResolved) return;
        isResolved = true;

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
        if (isResolved) return;
        isResolved = true;

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
      }, 10000);
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