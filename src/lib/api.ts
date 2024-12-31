import { API_BASE_URL } from './constants';
import { Document, DocumentResponse } from '@/types';

const WS_BASE_URL = 'wss://explainai-new-528ec8eb814a.herokuapp.com';

interface MessageHandler {
  (data: unknown): void;
}

interface ApprovedUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_login: string | null;
}

export async function uploadDocument(file: File, token: string | null | undefined): Promise<{ document_id: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload document');
  }

  return response.json();
}

export async function listDocuments(token: string | null | undefined, isDemo: boolean = false): Promise<Document[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = isDemo ? '/api/documents/examples' : '/api/auth/me/documents';
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to list documents');
  }

  const data = await response.json();
  return (data as DocumentResponse[]).map((doc) => ({
    id: doc.id,
    title: doc.title || doc.name || 'Untitled Document',
    created_at: doc.created_at || new Date().toISOString(),
    isExample: isDemo,
    content: doc.content,
    preview: doc.preview,
    name: doc.name
  }));
}

export async function deleteDocument(documentId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
}

export async function listApprovedUsers(token: string): Promise<ApprovedUser[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/approved-users`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch approved users');
  }

  return response.json();
}

export async function approveUser(email: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/approve-user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    throw new Error('Failed to approve user');
  }
}

export async function removeUserApproval(email: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/approve-user/${email}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to remove user approval');
  }
}

export async function getUploadProgress(filename: string, token: string): Promise<{
  filename: string;
  total_chunks: number;
  processed_chunks: number;
  is_complete: boolean;
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/upload-progress/${encodeURIComponent(filename)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get upload progress');
  }

  return response.json();
}

export async function getUserCost(token: string): Promise<{ total_cost: number; formatted_cost: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me/cost`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user cost');
  }
  
  const data = await response.json();
  // Round the formatted cost to 2 decimal places
  data.formatted_cost = `$${Number(data.total_cost).toFixed(2)}`;
  return data;
}

// Base WebSocket class with all the common functionality
export class BaseWebSocket {
  protected ws: WebSocket | null = null;
  protected messageHandlers: Map<string, MessageHandler[]> = new Map();
  protected reconnectAttempts = 0;
  protected maxReconnectAttempts = 5;
  protected reconnectDelay = 1000;
  protected isConnecting = false;
  protected messageQueue: { event: string; data: unknown }[] = [];
  protected documentId: string;
  protected connectionPromise: Promise<void> | null = null;
  protected token: string | null;

  constructor(documentId: string, protected endpoint: string, token: string | null = null) {
    this.documentId = documentId;
    this.token = token;
    this.connectionPromise = this.connect();
  }

  protected connect(): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return this.connectionPromise!;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      console.log(`Connecting to WebSocket for document ${this.documentId} at ${this.endpoint}...`);
      
      // Add /api/ to the path and handle token
      const wsUrl = `${WS_BASE_URL}/api${this.endpoint}/${this.documentId}${this.token ? `?token=${this.token.replace('Bearer ', '')}` : ''}`;
      
      console.log('Connecting with URL:', wsUrl);
      const ws = new WebSocket(wsUrl);
      const timeoutId = setTimeout(() => {
        cleanup();
        const error = new Error('WebSocket connection timeout');
        console.error(error);
        reject(error);
        this.handleReconnect();
      }, 5000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        ws.onopen = null;
        ws.onerror = null;
      };

      ws.onopen = () => {
        cleanup();
        console.log('WebSocket connected to', this.endpoint);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.ws = ws;
        this.flushMessageQueue();
        resolve();
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        this.ws = null;
        this.isConnecting = false;
        this.handleReconnect();
      };

      ws.onerror = (error) => {
        cleanup();
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        reject(error);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Raw WebSocket message:', event.data);
          console.log('Parsed WebSocket message:', message);
          
          const { type, data } = message;
          
          const handlers = this.messageHandlers.get(type);
          if (handlers) {
            console.log('Found handlers for type:', type);
            handlers.forEach((handler) => handler(data));
          } else {
            console.log('No handlers for message type:', type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    });

    return this.connectionPromise;
  }

  protected handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay}ms...`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connectionPromise = this.connect();
    }, delay);
  }

  protected flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message.event, message.data);
      }
    }
  }

  public async send(event: string, data: unknown): Promise<void> {
    // Wait for connection before sending
    try {
      await this.connectionPromise;
    } catch (error) {
      console.error('Connection failed:', error);
      this.messageQueue.push({ event, data });
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not ready, queueing message...');
      this.messageQueue.push({ event, data });
      return;
    }

    try {
      const message = { type: event, data };
      console.log('Sending WebSocket message:', message);
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.messageQueue.push({ event, data });
    }
  }

  public onMessage(event: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)?.push(handler);
  }

  public off(event: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public close() {
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection attempts
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.messageQueue = [];
  }

  public async waitForConnection(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    return this.connectionPromise || this.connect();
  }

  protected handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      console.log('Raw WebSocket message:', event.data);
      console.log('Parsed WebSocket message:', message);
      
      const { type, data, error } = message;
      
      if (error) {
        console.error('WebSocket error:', error);
        const handlers = this.messageHandlers.get(`${type}.error`);
        if (handlers) {
          handlers.forEach(handler => handler({ error }));
        }
        return;
      }
      
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        console.log('Found handlers for type:', type);
        handlers.forEach(handler => handler(data));
      } else {
        console.log('No handlers for message type:', type);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error parsing WebSocket message:', error.message);
      }
    }
  }
}

// Document-specific WebSocket
export class DocumentWebSocket extends BaseWebSocket {
  private pendingMetadataRequest = false;

  constructor(documentId: string, token: string | null = null) {
    super(documentId, '/documents/stream', token);
  }

  protected connect(): Promise<void> {
    return super.connect().then(() => {
      if (!this.pendingMetadataRequest) {
        this.pendingMetadataRequest = true;
        this.send('document.metadata', { document_id: this.documentId });
      }
    });
  }

  protected handleReconnect() {
    this.pendingMetadataRequest = false;
    super.handleReconnect();
  }

  // Add method to handle cleanup if needed
  public removeEventHandlers() {
    // Implement cleanup logic here
    this.messageHandlers.clear();
  }
}

export function createWebSocket(documentId: string, token: string | null | undefined): WebSocket {
  const wsUrl = new URL(`${WS_BASE_URL}/api/conversations/stream/${documentId}`);
  if (token) {
    wsUrl.searchParams.append('token', token);
  }
  return new WebSocket(wsUrl.toString());
}