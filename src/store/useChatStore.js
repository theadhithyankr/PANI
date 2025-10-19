import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useChatStore = create(
  persist(
    (set, get) => ({
      // Current signed-in user context for scoping chats
      currentUserId: null,
      conversations: [],
      pinnedIds: [],
      currentChatId: null,

      // Get all conversations
      getConversations: () => {
        const { conversations, currentUserId } = get();
        if (!currentUserId) return [];
        return conversations.filter(chat => chat.ownerUserId === currentUserId);
      },

      // Set conversations (for syncing with external data)
      setConversations: (convos) => set({ conversations: convos }),

      // Get conversation by ID (scoped to current user)
      getChatById: (id) => {
        const { conversations, currentUserId } = get();
        if (!currentUserId) return undefined;
        return conversations.find(chat => chat.id === id && chat.ownerUserId === currentUserId);
      },

      // Create a new chat
      createChat: (initialMessage = null) => {
        const { currentUserId } = get();
        const newChat = {
          id: Date.now().toString(),
          title: 'New Chat',
          messages: initialMessage ? [initialMessage] : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          conversation_type: 'general',
          summary: initialMessage?.content || '',
          ownerUserId: currentUserId || null
        };

        set(state => ({
          conversations: [newChat, ...state.conversations],
          currentChatId: newChat.id
        }));

        return newChat;
      },

      // Add message to existing chat
      addMessageToChat: (chatId, message) => {
        set(state => ({
          conversations: state.conversations.map(chat => 
            chat.id === chatId 
              ? {
                  ...chat,
                  messages: [...chat.messages, message],
                  updated_at: new Date().toISOString(),
                  // Update summary if it's empty or this is the first user message
                  summary: !chat.summary || chat.summary === 'New Chat' 
                    ? (message.type === 'user' ? message.content.slice(0, 100) + (message.content.length > 100 ? '...' : '') : chat.summary)
                    : chat.summary
                }
              : chat
          )
        }));
      },

      // Update chat title
      updateChatTitle: (chatId, title) => {
        set(state => ({
          conversations: state.conversations.map(chat => 
            chat.id === chatId 
              ? { ...chat, title, updated_at: new Date().toISOString() }
              : chat
          )
        }));
      },

      // Update chat messages (for bulk updates)
      updateChatMessages: (chatId, messages) => {
        set(state => ({
          conversations: state.conversations.map(chat => 
            chat.id === chatId 
              ? { 
                  ...chat, 
                  messages, 
                  updated_at: new Date().toISOString(),
                  // Update summary from first user message if available
                  summary: messages.find(m => m.type === 'user')?.content.slice(0, 100) + 
                    (messages.find(m => m.type === 'user')?.content.length > 100 ? '...' : '') || chat.summary
                }
              : chat
          )
        }));
      },

      // Delete chat
      deleteChat: (chatId) => {
        set(state => ({
          conversations: state.conversations.filter(chat => chat.id !== chatId),
          pinnedIds: state.pinnedIds.filter(id => id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId
        }));
      },

      // Set current chat ID
      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),

      // Set current user ID to scope chat operations
      setCurrentUserId: (userId) => set({ currentUserId: userId }),

      // Pin/unpin functionality
      pinChat: (id) => set(state => ({ 
        pinnedIds: [...new Set([...state.pinnedIds, id])] 
      })),
      
      unpinChat: (id) => set(state => ({ 
        pinnedIds: state.pinnedIds.filter(pid => pid !== id) 
      })),
      
      isPinned: (id) => get().pinnedIds.includes(id),

      // Get chat statistics
      getChatStats: () => {
        const conversations = get().conversations;
        return {
          totalChats: conversations.length,
          totalMessages: conversations.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0),
          pinnedChats: get().pinnedIds.length
        };
      },

      // Search chats
      searchChats: (searchTerm) => {
        const conversations = get().conversations;
        if (!searchTerm.trim()) return conversations;
        
        return conversations.filter(chat => 
          chat.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.messages?.some(message => 
            message.content?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      },

      // Clear all chats (for testing/reset)
      clearAllChats: () => set({ 
        conversations: [], 
        pinnedIds: [], 
        currentChatId: null 
      })
    }),
    { 
      name: 'chat-history-store',
      version: 1 // Added version for migration handling
    }
  )
);

export default useChatStore; 