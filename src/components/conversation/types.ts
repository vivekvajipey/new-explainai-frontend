export interface MainConversationType {
  type: 'main';
  id: string;
}

export interface ChunkConversationType {
  type: 'chunk';
  id: string;
  highlightText: string;
  chunkId: string;
}

export type ActiveConversationType = MainConversationType | ChunkConversationType;
