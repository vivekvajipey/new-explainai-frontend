const API_BASE_URL = 'http://localhost:8000/api';
const WS_BASE_URL = 'ws://localhost:8000/api';

export async function uploadDocument(file: File): Promise<{ document_id: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload document');
  }

  return response.json();
}

export class DocumentWebSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageQueue: { event: string; data: any }[] = [];
  private documentId: string;
  private pendingMetadataRequest = false;

  constructor(documentId: string) {
    this.documentId = documentId;
    this.connect();
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    const ws = new WebSocket(`${WS_BASE_URL}/documents/stream/${this.documentId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.ws = ws;
      
      // Send initial metadata request after connection
      if (!this.pendingMetadataRequest) {
        this.pendingMetadataRequest = true;
        this.send('document.metadata', { document_id: this.documentId });
      }
      
      this.flushMessageQueue();
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      this.ws = null;
      this.isConnecting = false;
      this.pendingMetadataRequest = false;
      this.handleReconnect();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
      // Don't set this.ws to null here, let onclose handle it
    };

    ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        if (type === 'document.metadata.completed') {
          this.pendingMetadataRequest = false;
        }
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
          handlers.forEach((handler) => handler(data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay}ms...`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message.event, message.data);
      }
    }
  }

  public send(event: string, data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not ready, queueing message...');
      this.messageQueue.push({ event, data });
      return;
    }

    try {
      this.ws.send(JSON.stringify({ type: event, data }));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.messageQueue.push({ event, data });
    }
  }

  public onMessage(event: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)?.push(handler);
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
}
