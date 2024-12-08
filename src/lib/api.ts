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
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(documentId: string) {
    this.connect(documentId);
  }

  private connect(documentId: string) {
    this.ws = new WebSocket(`${WS_BASE_URL}/documents/stream/${documentId}`);
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message.data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  public onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  public send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  public close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
