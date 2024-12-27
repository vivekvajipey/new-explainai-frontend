// new-explainai-frontend/src/lib/websocket/ConversationWebSocket.ts

import { 
  ConversationResponse,
  ChunkConversationsResponse,
  WebSocketError,
  MessageHandler,
  ConversationCreateCompleted,
  ConversationMessageSendCompleted,
  ConversationMessagesCompleted,
  ChunkConversationPayload
} from './types';
import { MessageRole } from '@/types/conversation';  // This line is already correct

const WS_BASE_URL = 'wss://explainai-new-528ec8eb814a.herokuapp.com';

export class ConversationWebSocket {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 2;
  private readonly reconnectDelay = 1000;
  private eventHandlers = new Map<string, Set<MessageHandler<unknown>>>();
  private pendingMessages: { type: string; data: unknown; request_id?: string }[] = [];
  private requestCounter = 0;

  constructor(
    private readonly documentId: string,
    private readonly token: string | null = null,
  ) {
    this.connectionPromise = this.connect();
  }

  private async connect(): Promise<void> {
    console.log('ConversationWebSocket: Connecting...');
    const wsUrl = `${WS_BASE_URL}/api/conversations/stream/${this.documentId}${
      this.token ? `?token=${this.token.replace('Bearer ', '')}` : ''
    }`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      const timeoutId = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          this.ws?.close();
          reject(new Error('Connection timeout'));
          this.handleReconnect();
        }
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(timeoutId);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
        this.processPendingMessages();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.ws = null;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data, request_id } = message;
          console.log('WebSocket received message:', { type, data, request_id });
          
          const handlers = this.eventHandlers.get(type);
          if (handlers) {
            console.log('Found handlers for type:', type);
            // Pass both the data and request_id to handlers
            handlers.forEach(handler => {
              console.log('Calling handler with:', { ...data, request_id });
              handler({ ...data, request_id });
            });
          } else {
            console.log('No handlers found for type:', type);
            this.pendingMessages.push({ type, data, request_id });
          }
        } catch (error) {
          console.error('Failed to process message:', error);
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
 
  private send(type: string, data: Record<string, unknown>): string {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
 
    const request_id = `req_${++this.requestCounter}`;
    const message = JSON.stringify({ 
      type, 
      data: { 
        ...data, 
        request_id 
      } 
    });
    console.log('ConversationWebSocket: Sending', message);
    this.ws.send(message);
    return request_id;
  }
 
  private onMessage<T>(event: string, handler: MessageHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler as MessageHandler<unknown>);
  }
 
  private processPendingMessages(): void {
    this.pendingMessages.forEach(message => {
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        const messageData = typeof message.data === 'object' && message.data !== null
          ? { ...(message.data as Record<string, unknown>), request_id: message.request_id }
          : { data: message.data, request_id: message.request_id };
        handlers.forEach(handler => handler(messageData));
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
    await this.waitForConnection();
 
    return new Promise((resolve, reject) => {
      const request_id = this.send(requestType, this.ensureRecord(data));
      const timer = setTimeout(() => {
        this.removeHandler(responseType, handler);
        this.removeHandler(`${responseType}.error`, errorHandler);
        reject(new Error(`Timeout waiting for ${responseType}`));
      }, timeout);
 
      const handler = (response: T & { request_id?: string }) => {
        if (response.request_id === request_id) {
          clearTimeout(timer);
          resolve(response);
          this.removeHandler(responseType, handler);
          this.removeHandler(`${responseType}.error`, errorHandler);
        }
      };
 
      const errorHandler = (error: WebSocketError) => {
        if (error.request_id === request_id) {
          clearTimeout(timer);
          reject(new Error(error.message || `Failed during ${requestType}`));
          this.removeHandler(responseType, handler);
          this.removeHandler(`${responseType}.error`, errorHandler);
        }
      };
 
      this.onMessage(responseType, handler);
      this.onMessage(`${responseType}.error`, errorHandler);
    });
  }

  private ensureRecord(data: unknown): Record<string, unknown> {
    if (typeof data === 'object' && data !== null) {
      return data as Record<string, unknown>;
    }
    return { value: data };
  }
 
  // Public methods for conversation management
  async createMainConversation(): Promise<string> {
    const response = await this.sendAndWait<ConversationCreateCompleted>(
      'conversation.main.create',
      'conversation.main.create.completed',
      { document_id: this.documentId }
    );
    return response.conversation_id;
  }
 
  async createChunkConversation(
    chunkId: string,
    highlightText: string,
    highlightRange?: { start: number; end: number }
  ): Promise<string> {
    const payload: ChunkConversationPayload = {
      document_id: this.documentId,
      chunk_id: chunkId,
      highlight_text: highlightText
    };
 
    if (highlightRange) {
      payload.highlight_range = highlightRange;
    }
 
    const response = await this.sendAndWait<ConversationCreateCompleted>(
      'conversation.chunk.create',
      'conversation.chunk.create.completed',
      payload
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
 
  async sendMessageWithStreaming(
    conversationId: string,
    content: string,
    handlers: {
      onToken: (message: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    },
    chunkId?: string,
    conversationType: string = 'main'
  ): Promise<ConversationMessageSendCompleted> {
    await this.waitForConnection();
    let fullMessage = '';
    let isComplete = false;
 
    // Set up token handler BEFORE sending message
    const tokenHandler = (data: { token: string; request_id?: string }) => {
      console.log('Token received:', data.token);
      if (!isComplete) {
        fullMessage += data.token;
        handlers.onToken(fullMessage);
      }
    };

    this.onMessage('chat.token', tokenHandler);
 
    try {
      // Send the message
      const response = await this.sendAndWait<ConversationMessageSendCompleted>(
        'conversation.message.send',
        'conversation.message.send.completed',
        {
          conversation_id: conversationId,
          content,
          chunk_id: chunkId,
          conversation_type: conversationType
        }
      );

      isComplete = true;
      handlers.onComplete();
      this.removeHandler('chat.token', tokenHandler);
      return response;
    } catch (error) {
      handlers.onError(error as Error);
      this.removeHandler('chat.token', tokenHandler);
      throw error;
    }
  }
 
  async getMessages(conversationId: string): Promise<ConversationResponse> {
    const response = await this.sendAndWait<ConversationMessagesCompleted>(
      'conversation.messages.get',
      'conversation.messages.completed',
      { conversation_id: conversationId }
    );
 
    return {
      conversation_id: response.conversation_id,
      messages: response.messages.map(msg => ({
        id: msg.id,
        role: msg.role as MessageRole,
        content: msg.content,
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
 
  async listConversations(): Promise<Record<string, {
    document_id: string,
    chunk_id?: number,
    created_at: string,
    highlight_text?: string
  }>> {
    const response = await this.sendAndWait<{
      conversations: Record<string, {
        document_id: string,
        chunk_id?: number,
        created_at: string,
        highlight_text?: string
      }>
    }>(
      'conversation.list',
      'conversation.list.completed',
      {}
    );
    return response.conversations;
  }
 
  removeHandler<T>(event: string, handler: MessageHandler<T>): void {
    this.eventHandlers.get(event)?.delete(handler as MessageHandler<unknown>);
    if (this.eventHandlers.get(event)?.size === 0) {
      this.eventHandlers.delete(event);
    }
  }
 
  close(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
    this.pendingMessages = [];
    this.isConnected = false;
  }
 }
