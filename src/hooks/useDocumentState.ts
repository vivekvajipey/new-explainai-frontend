import { useEffect, useCallback } from 'react';
import { useDocument } from '@/context/DocumentContext';
import { api } from '@/lib/api';
import { Chunk, ChunkState } from '@/interfaces/document';

export function useDocumentState(documentId: string) {
  const { state, setActiveChunk, dispatch } = useDocument();

  const fetchDocument = useCallback(async () => {
    if (!documentId || state.chunks.size > 0) {
      return;
    }

    try {
      // Set document ID first
      dispatch({ type: 'SET_DOCUMENT_ID', payload: documentId });

      // Fetch document chunks
      const response = await api.getChunks(documentId);
      const chunks = Array.isArray(response) ? response : [];
      
      if (chunks.length === 0) {
        console.warn('No chunks found for document:', documentId);
        return;
      }

      // Create chunk state map
      const chunkMap = new Map<string, ChunkState>();
      chunks.forEach((chunk: any) => {
        chunkMap.set(chunk.id, {
          chunk: {
            id: chunk.id,
            content: chunk.content,
            position: chunk.sequence || 0
          },
          conversations: []
        });
      });

      // Create main conversation only if it doesn't exist
      if (!state.mainConversation) {
        const mainConversation = await api.createConversation(documentId, 'main');
        dispatch({ type: 'SET_MAIN_CONVERSATION', payload: mainConversation });
      }

      // Update state
      dispatch({ type: 'SET_CHUNKS', payload: chunkMap });
      
      // Set first chunk as active if none is set
      if (!state.activeChunkId && chunks.length > 0) {
        setActiveChunk(chunks[0].id);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  }, [documentId, dispatch, setActiveChunk, state.chunks.size, state.mainConversation, state.activeChunkId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  return state;
}