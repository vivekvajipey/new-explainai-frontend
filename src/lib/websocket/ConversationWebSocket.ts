// new-explainai-frontend/src/lib/websocket/ConversationWebSocket.ts

import { 
  ConversationResponse,
  ChunkConversationsResponse,
  WebSocketError,
  MessageHandler,
  ConversationCreateCompleted,
  ConversationMessageSendCompleted,
  ConversationMessagesCompleted,
} from './types';
import { useConversationStore } from '@/stores/conversationStores';

const WS_BASE_URL = 'ws://localhost:8000/api';

export class ConversationWebSocket {
  private ws: WebSocket | null = null;
  private eventHandlers = new Map<string, Set<MessageHandler<unknown>>>();
  private pendingMessages: { type: string; data: unknown }[] = [];
  public isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 2;
  private readonly reconnectDelay = 1000;

  private setupMessageHandlers() {
    // Handler for message send completion
    this.onMessage<ConversationMessageSendCompleted>(
      'conversation.message.send.completed', 
      (data) => {
        useConversationStore.getState().addMessage(data.conversation_id, {
          id: data.user_message_id,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        });
      }
    );

    // Handler for messages list completion
    this.onMessage<ConversationMessagesCompleted>(
      'conversation.messages.completed',
      (data) => {
        useConversationStore.getState().setMessages(
          data.conversation_id,
          data.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.message,
            timestamp: msg.created_at
          }))
        );
      }
    );
  }

  constructor(private readonly documentId: string) {
    console.log('ConversationWebSocket: Initializing for document', documentId);
    this.connectionPromise = this.connect();
    this.setupMessageHandlers();
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

  private async sendAndWait<T>(
    requestType: string,
    responseType: string,
    data: unknown,
    timeout: number = 10000
  ): Promise<T> {
    console.log("[DEBUG] sendAndWait START:", { requestType, responseType, data });
    await this.waitForConnection();
  
    return new Promise((resolve, reject) => {
      // Store timer reference so we can clear it if we get a successful response or error
      const timer = setTimeout(() => {
        console.error(`[DEBUG] sendAndWait TIMEOUT for ${responseType}`);
        this.removeHandler(responseType, handler);
        this.removeHandler(`${responseType}.error`, errorHandler);
        reject(new Error(`Timeout waiting for ${responseType}`));
      }, timeout);
  
      const handler = (data: T) => {
        console.log(`[DEBUG] sendAndWait SUCCESS for ${responseType}:`, data);
        clearTimeout(timer); // Clear timeout on success
        resolve(data);
        this.removeHandler(responseType, handler);
        this.removeHandler(`${responseType}.error`, errorHandler);
      };
  
      const errorHandler = (error: WebSocketError) => {
        console.error(`[DEBUG] sendAndWait ERROR for ${responseType}:`, error);
        clearTimeout(timer); // Clear timeout on error
        reject(new Error(error.message || `Failed during ${requestType}`));
        this.removeHandler(responseType, handler);
        this.removeHandler(`${responseType}.error`, errorHandler);
      };
  
      this.onMessage(responseType, handler);
      this.onMessage(`${responseType}.error`, errorHandler);
  
      console.log("[DEBUG] sendAndWait sending:", { requestType, data });
      this.send(requestType, data);
    });
  }

  async createMainConversation(): Promise<string> {
    console.log("[ConversationWebSocket] CALLING createMainConversation!!!");
    const response = await this.sendAndWait<ConversationCreateCompleted>(
      'conversation.main.create',
      'conversation.main.create.completed',
      { document_id: this.documentId }
    );
    return response.conversation_id;
  }

  async createChunkConversation(chunkId: string, highlightText: string): Promise<string> {
    const response = await this.sendAndWait<ConversationCreateCompleted>(
      'conversation.chunk.create',
      'conversation.chunk.create.completed',
      { document_id: this.documentId, chunk_id: chunkId, highlight_text: highlightText }
    );
    return response.conversation_id;
  }

  async sendMessage(
    conversationId: string, 
    content: string, 
    chunkId?: string, 
    conversationType?: string
  ): Promise<ConversationMessageSendCompleted> {
    return this.sendAndWait<ConversationMessageSendCompleted>(
      'conversation.message.send',
      'conversation.message.send.completed',
      {
        conversation_id: conversationId,
        content,
        chunk_id: chunkId,
        conversation_type: conversationType
      },
      30000 
    );
  }

  async getMessages(conversationId: string): Promise<ConversationResponse> {
    const response = await this.sendAndWait<ConversationMessagesCompleted>(
      'conversation.messages.list',
      'conversation.messages.completed',
      { conversation_id: conversationId }
    );

    return {
      conversation_id: response.conversation_id,
      messages: response.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.message,
        timestamp: msg.created_at
      }))
    };
  }

  async getChunkConversations(chunkId: string): Promise<ChunkConversationsResponse> {
    return this.sendAndWait<ChunkConversationsResponse>(
      'conversation.get.by.sequence',
      'conversation.chunk.get.completed',
      { sequence_number: chunkId },
      5000
    );
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