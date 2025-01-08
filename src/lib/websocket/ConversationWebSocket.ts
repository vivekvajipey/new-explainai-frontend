// new-explainai-frontend/src/lib/websocket/ConversationWebSocket.ts

import { 
  ConversationResponse,
  ChunkConversationsResponse,
  WebSocketError,
  MessageHandler,
  ConversationCreateCompleted,
  ConversationMessageSendCompleted,
  ConversationMessagesCompleted,
  ChunkConversationPayload,
  GenerateQuestionsCompleted,
  GenerateQuestionsRequest,
} from './types';
import { MessageRole, Question, RegenerateQuestionsResponse } from '@/types/conversation';
import { EXAMPLE_DOCUMENT_IDS, API_BASE_URL } from '@/lib/constants';

// Dynamically construct WebSocket URL from API_BASE_URL
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

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
  private onCostLimitError?: (userCost: number, costLimit: number) => void;
  private onError?: (error: WebSocketError) => void;
  private isDemoDocument: boolean;
  private readonly DEMO_MESSAGE_LIMIT = 5;

  constructor(
    private readonly documentId: string,
    private readonly token: string | null = null,
    onCostLimitError?: (userCost: number, costLimit: number) => void,
    onError?: (error: WebSocketError) => void,
  ) {
    this.isDemoDocument = EXAMPLE_DOCUMENT_IDS.includes(documentId);
    this.connectionPromise = this.connect();
    this.onCostLimitError = onCostLimitError;
    this.onError = onError;
  }

  private async connect(): Promise<void> {
    console.log('ConversationWebSocket: Connecting...');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('WS_BASE_URL:', WS_BASE_URL);
    
    const wsUrl = `${WS_BASE_URL}/api/conversations/stream/${this.documentId}${
      this.token ? `?token=${this.token.replace('Bearer ', '')}` : ''
    }`;
    
    console.log('Connecting to WebSocket URL:', wsUrl);

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

      this.ws.onmessage = this.onmessage;
    });
  }

  private onmessage = (event: MessageEvent) => {
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
        // If it's an error message, pass it to the global error handler
        if (type.endsWith('.error')) {
          this.onError?.(message);
        } else {
          this.pendingMessages.push({ type, data, request_id });
        }
      }
    } catch (error) {
      console.error('Failed to process message:', error);
    }
  };

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

  private getDemoMessageCount(): number {
    return parseInt(localStorage.getItem('total_demo_messages') || '0');
  }
  
  private incrementDemoMessageCount(): void {
    const count = this.getDemoMessageCount();
    localStorage.setItem('total_demo_messages', (count + 1).toString());
  }

  public getRemainingDemoMessages(): number {
    if (!this.isDemoDocument) return 0;
    return Math.max(0, this.DEMO_MESSAGE_LIMIT - this.getDemoMessageCount());
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
        this.handleWebSocketError(error);
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

  private handleWebSocketError(error: WebSocketError) {
    try {
      // Handle string-encoded error data
      if (error.data?.error && typeof error.data.error === 'string' && error.data.error.startsWith('402:')) {
        const errorData = JSON.parse(error.data.error.substring(4).replace(/'/g, '"'));
        if (errorData.error === 'cost_limit_exceeded' && 
            typeof errorData.user_cost === 'number' && 
            typeof errorData.cost_limit === 'number') {
          this.onCostLimitError?.(errorData.user_cost, errorData.cost_limit);
          return;
        }
      }
      
      // Handle direct error data structure
      if (error.status === 402 && 
          error.data?.error === 'cost_limit_exceeded' && 
          error.data.user_cost != null && 
          error.data.cost_limit != null) {
        this.onCostLimitError?.(error.data.user_cost, error.data.cost_limit);
      }
    } catch (e) {
      console.error('Failed to parse cost limit error:', e);
    }
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
    if (this.isDemoDocument) {
      const remaining = this.getRemainingDemoMessages();
      if (remaining <= 0) {
        throw new Error('You have reached the demo message limit. Please sign in to continue.');
      }
      this.incrementDemoMessageCount();
    }

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
    config: {
      chunkId?: string;
      type?: string;
      questionId?: string;
      useFullContext?: boolean;
    } = {}
  ): Promise<ConversationMessageSendCompleted> {
    console.log("This is a demo document?", this.isDemoDocument);
    if (this.isDemoDocument) {
      const remaining = this.getRemainingDemoMessages();
      console.log("Remaining demo messages:", remaining);
      if (remaining <= 0) {
        throw new Error('You have reached the demo message limit. Please sign in to continue.');
      }
      this.incrementDemoMessageCount();
    }
  
    await this.waitForConnection();
    let fullMessage = '';
    let isComplete = false;
  
    const tokenHandler = (data: { token: string; request_id?: string }) => {
      console.log('Token received:', data.token);
      if (!isComplete) {
        fullMessage += data.token;
        handlers.onToken(fullMessage);
      }
    };
  
    this.onMessage('chat.token', tokenHandler);
  
    try {
      console.log("Full context: ", config.useFullContext);
      const response = await this.sendAndWait<ConversationMessageSendCompleted>(
        'conversation.message.send',
        'conversation.message.send.completed',
        {
          conversation_id: conversationId,
          content,
          chunk_id: config.chunkId,
          conversation_type: config.type || 'main',
          question_id: config.questionId,
          use_full_context: config.useFullContext
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

  async generateQuestions(
    conversationId: string, 
    conversationType: 'main' | 'highlight',
    options: {
      chunkId?: string;
      count?: number;
    } = {}
  ): Promise<string[]> {
    const requestData: GenerateQuestionsRequest = {
      conversation_id: conversationId,
      conversation_type: conversationType,
      chunk_id: options.chunkId,
      count: options.count || 3
    };
  
    const response = await this.sendAndWait<GenerateQuestionsCompleted>(
      'conversation.questions.generate',
      'conversation.questions.generate.completed',
      requestData
    );
    
    return response.questions;
  }

  async listQuestions(conversationId: string): Promise<Question[]> {
    const response = await this.sendAndWait<{questions: Question[]}>(
      'conversation.questions.list',
      'conversation.questions.list.completed',
      { conversation_id: conversationId }
    );
    return response.questions;
  }

  async regenerateQuestions(
    conversationId: string,
    conversationType: 'main' | 'highlight',
    options: {
      chunkId?: string;
    } = {}
  ): Promise<Question[]> {
    const response = await this.sendAndWait<RegenerateQuestionsResponse>(
      'conversation.questions.regenerate',
      'conversation.questions.regenerate.completed',
      {
        conversation_id: conversationId,
        conversation_type: conversationType,
        chunk_id: options.chunkId
      }
    );
    return response.questions;
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
