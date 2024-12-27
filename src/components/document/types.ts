export interface DocumentChunk {
    id: string;
    sequence: number;
    content: string;
    meta_data: {
      length: number;
      index: number;
    };
  }
  
export interface DocumentMetadata {
    title: string;
    pages: number;
    text: string;
    content?: string;
    chunks: DocumentChunk[];
    meta_data: {
      chunks_count: number;
    };
  }
  
export interface DocumentMetadataResponse {
    document: DocumentMetadata;
  }

export interface Highlight {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  conversationId: string;
  chunkId: string;
}