import { useState, forwardRef, useImperativeHandle } from 'react';
import { X } from 'lucide-react';
import MainConversation from './MainConversation';
import ChunkConversation from './ChunkConversation';

interface Tab {
  id: string;
  type: 'main' | 'chunk';
  title: string;
  active: boolean;
  data: {
    documentId: string;
    sequence?: string;
    highlightText?: string;
  };
}

interface ConversationTabsProps {
  documentId: string;
}

export interface ConversationTabsRef {
  createChunkConversation: (text: string, sequence: string) => void;
}

const ConversationTabs = forwardRef<ConversationTabsRef, ConversationTabsProps>(
  ({ documentId }, ref) => {
    const [tabs, setTabs] = useState<Tab[]>([{
      id: 'main',
      type: 'main',
      title: 'Main Conversation',
      active: true,
      data: { documentId }
    }]);

    const handleTabClick = (tabId: string) => {
      setTabs(prev => prev.map(tab => ({
        ...tab,
        active: tab.id === tabId
      })));
    };

    const handleCloseTab = (tabId: string) => {
      if (tabId === 'main') return;
      setTabs(prev => prev.filter(tab => tab.id !== tabId));
    };

    const createChunkConversation = (highlightText: string, sequence: string) => {
      const newTab: Tab = {
        id: `chunk-${Date.now()}`,
        type: 'chunk',
        title: `Discussion: ${highlightText.slice(0, 30)}...`,
        active: true,
        data: {
          documentId,
          sequence,
          highlightText
        }
      };

      setTabs(prev => prev.map(tab => ({
        ...tab,
        active: false
      })).concat(newTab));
    };

    // Expose the createChunkConversation method via ref
    useImperativeHandle(ref, () => ({
      createChunkConversation
    }));

    return (
      <div className="flex flex-col h-full">
        {/* Tab Bar */}
        <div className="flex space-x-1 bg-earth-100 dark:bg-earth-900 p-2 rounded-t-lg">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer
                ${tab.active 
                  ? 'bg-white dark:bg-earth-800 text-earth-900 dark:text-earth-50' 
                  : 'bg-earth-200 dark:bg-earth-700 text-earth-600 dark:text-earth-400 hover:bg-earth-300'
                }
              `}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="truncate max-w-[150px]">{tab.title}</span>
              {tab.id !== 'main' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                  className="hover:bg-earth-200 dark:hover:bg-earth-600 rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Conversation Container */}
        <div className="flex-1">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`h-full ${tab.active ? 'block' : 'hidden'}`}
            >
              {tab.type === 'main' ? (
                <MainConversation documentId={tab.data.documentId} />
              ) : (
                <ChunkConversation
                  documentId={tab.data.documentId}
                  sequence={tab.data.sequence!}
                  highlightText={tab.data.highlightText!}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

ConversationTabs.displayName = 'ConversationTabs';

export default ConversationTabs; 