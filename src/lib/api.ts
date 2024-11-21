// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface UploadResponse {
  document_id: string;
  status: string;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface Conversation {
  // Add properties for the Conversation interface
}

export const api = {
  uploadDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload document');
    }
    return response.json();
  },

  getDocument: async (id: string) => {
    const response = await fetch(`${API_URL}/documents/${id}`);
    if (!response.ok) {
      throw new Error('Failed to get document');
    }
    return response.json();
  },

  getChunks: async (documentId: string) => {
    const response = await fetch(`${API_URL}/documents/${documentId}/chunks`);
    if (!response.ok) {
      throw new Error('Failed to get chunks');
    }
    return response.json();
  },

  createConversation: async (
    documentId: string,
    type: 'main' | 'chunk',
    chunkId?: string,
    highlightRange?: [number, number],
    highlightedText?: string
  ): Promise<Conversation> => {
    const endpoint = type === 'main' 
      ? `/documents/${documentId}/conversations`
      : `/documents/${documentId}/conversations/chunk`;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: type === 'main' 
        ? JSON.stringify({})
        : JSON.stringify({
            chunk_id: chunkId,
            highlight_range: highlightRange,
            highlighted_text: highlightedText,
          }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    return response.json();
  },

  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    try {
      const response = await fetch(`${API_URL}/conversations/${conversationId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let fullContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            
            // Handle raw text tokens
            if (data) {
              try {
                // First try to parse as JSON in case it's a structured message
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                }
              } catch (e) {
                // If it's not JSON, treat it as raw text
                fullContent += data + ' ';
              }
            }
          }
        }
      }
      
      // Create the message object
      return {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        content: fullContent.trim(),
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  generateQuestions: async (conversationId: string, count: number = 3): Promise<string[]> => {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        count,
        previous_questions: []
      })
    });
    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }
    return response.json();
  },
};