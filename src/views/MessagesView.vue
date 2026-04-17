<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { 
  Search, 
  Send, 
  MessageSquare, 
  User, 
  Users,
  MoreVertical,
  Check,
  CheckCheck,
  ArrowLeft,
  Loader2
} from 'lucide-vue-next';
import UserAvatar from '../components/UserAvatar.vue';

const store = usePortalStore();
const activeConversationId = ref(null);
const messageInput = ref('');
const searchQuery = ref('');
const showContacts = ref(false); // Toggle between recent convos and all contacts
const chatScroll = ref(null);
const isLoadingChat = ref(false);

let pollingInterval = null;

const currentRecipient = computed(() => {
  if (!activeConversationId.value) return null;
  // Look in conversations or contacts
  return store.conversations.find(c => c.id === activeConversationId.value) || 
         store.contacts.find(c => c.id === activeConversationId.value);
});

const filteredContacts = computed(() => {
  // If we have search results from the server, show them
  if (searchQuery.value && store.searchResults.length > 0) return store.searchResults;
  // Fallback to local contacts if no query
  if (!searchQuery.value) return store.contacts;
  // Local filter for contacts
  return store.contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.id.includes(searchQuery.value)
  );
});

// Debounced search
let searchTimeout = null;
watch(searchQuery, (newQuery) => {
  if (!showContacts.value) return; // Only search server when in "New Message" mode
  
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    store.searchUsers(newQuery);
  }, 300);
});

const sortedConversations = computed(() => {
  return [...store.conversations].sort((a, b) => 
    new Date(b.last_message_at) - new Date(a.last_message_at)
  );
});

const fetchInitialData = async () => {
  await Promise.all([
    store.fetchMyMessages(), // This actually fetches conversations now
    store.fetchChatContacts()
  ]);
};

const selectConversation = async (id) => {
  activeConversationId.value = id;
  showContacts.value = false;
  isLoadingChat.value = true;
  await store.fetchPeerChat(id);
  // Clear unread locally
  const conv = store.conversations.find(c => c.id === id);
  if (conv) conv.unread_count = 0;
  isLoadingChat.value = false;
  scrollToBottom();
};

const handleSendMessage = async () => {
  if (!messageInput.value.trim() || !activeConversationId.value) return;
  
  const content = messageInput.value;
  messageInput.value = '';
  
  const result = await store.sendMessage(activeConversationId.value, content);
  if (result) {
    scrollToBottom();
    // Refresh conversations list to update last message
    store.fetchMyMessages();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatScroll.value) {
    chatScroll.value.scrollTop = chatScroll.value.scrollHeight;
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

onMounted(() => {
  fetchInitialData();
  pollingInterval = setInterval(() => {
    store.fetchMyMessages();
    if (activeConversationId.value) {
      store.fetchPeerChat(activeConversationId.value);
    }
  }, 4000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

watch(() => store.chatMessages.length, () => {
  scrollToBottom();
});
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50/30 overflow-hidden pt-16 lg:pt-0">
    <div class="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full lg:p-6 lg:gap-6">
      
      <!-- Sidebar: Conversations/Contacts -->
      <aside 
        class="w-full lg:w-96 bg-white lg:rounded-3xl border-r lg:border border-gray-100 shadow-sm flex flex-col overflow-hidden transition-all duration-300"
        :class="[activeConversationId ? 'hidden lg:flex' : 'flex']"
      >
        <!-- Sidebar Header -->
        <div class="p-6 border-b border-gray-50">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-xl font-bold text-gray-900 tracking-tight">Messages</h1>
            <button 
              @click="showContacts = !showContacts"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95',
                showContacts ? 'bg-gray-100 text-gray-600' : (store.isAdmin ? 'bg-primary text-white shadow-primary/20 hover:scale-105' : 'bg-[#002147] text-white shadow-[#002147]/20 hover:scale-105')
              ]"
            >
              <template v-if="!showContacts">
                <Users class="w-3.5 h-3.5" /> Start New Chat
              </template>
              <template v-else>
                <ArrowLeft class="w-3.5 h-3.5" /> Back to Inbox
              </template>
            </button>
          </div>
          
          <div class="relative group">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input 
              v-model="searchQuery"
              type="text" 
              :placeholder="showContacts ? 'Search students or admins...' : 'Search messages...'"
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
        </div>

        <!-- List Content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <!-- Contacts Directory (New Message) -->
          <template v-if="showContacts">
            <div 
              v-for="contact in filteredContacts" 
              :key="contact.id"
              @click="selectConversation(contact.id)"
              class="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-all border-b border-gray-50/50 group"
            >
              <div class="relative">
                <img :src="contact.avatar" class="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                <div v-if="contact.role === 'admin'" class="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-md border-2 border-white">
                  <Check class="w-2.5 h-2.5" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-gray-800 truncate flex items-center gap-2">
                  {{ contact.name }}
                  <span v-if="contact.role === 'admin'" class="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-black uppercase tracking-tighter">Admin</span>
                </p>
                <p class="text-[10px] font-bold text-primary uppercase tracking-widest truncate">
                  {{ contact.role === 'student' ? `${contact.program} • ${contact.year}` : 'Official Campus Admin' }}
                </p>
              </div>
            </div>
            <div v-if="filteredContacts.length === 0" class="p-12 text-center opacity-30">
              <Search class="w-12 h-12 mx-auto mb-4" />
              <p class="text-xs font-bold uppercase tracking-widest">No students found</p>
            </div>
          </template>

          <!-- Recent Conversations -->
          <template v-else>
            <div 
              v-for="conv in sortedConversations" 
              :key="conv.id"
              @click="selectConversation(conv.id)"
              :class="[
                'p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-gray-50/50',
                activeConversationId === conv.id ? (store.isAdmin ? 'bg-primary/5 border-l-4 border-l-primary' : 'bg-[#002147]/5 border-l-4 border-l-[#002147]') : 'hover:bg-gray-50'
              ]"
            >
              <div class="relative">
                <UserAvatar :name="conv.name" :avatar="conv.avatar" size="w-10 h-10" role="student" />
                <span v-if="conv.unread_count > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {{ conv.unread_count }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline mb-0.5">
                  <p class="font-bold text-gray-800 truncate text-sm">{{ conv.name }}</p>
                  <span class="text-[10px] font-bold text-gray-400 whitespace-nowrap">{{ formatTime(conv.last_message_at) }}</span>
                </div>
                <p class="text-xs text-gray-500 truncate font-medium">{{ conv.last_message }}</p>
              </div>
            </div>
            <div v-if="sortedConversations.length === 0" class="p-12 text-center opacity-30 mt-10">
              <MessageSquare class="w-16 h-16 mx-auto mb-4" />
              <p class="text-xs font-bold uppercase tracking-widest">No conversations yet</p>
              <button @click="showContacts = true" class="mt-4 text-primary text-[10px] font-black uppercase tracking-tighter hover:underline">Find a student</button>
            </div>
          </template>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main 
        class="flex-1 bg-white lg:rounded-3xl lg:border border-gray-100 shadow-sm flex flex-col overflow-hidden relative"
        :class="[!activeConversationId ? 'hidden lg:flex' : 'flex']"
      >
        <template v-if="activeConversationId">
          <!-- Chat Header -->
          <div class="h-20 px-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
            <div class="flex items-center gap-4">
              <button @click="activeConversationId = null" class="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600">
                <ArrowLeft class="w-6 h-6" />
              </button>
              <img :src="currentRecipient?.avatar" class="w-12 h-12 rounded-2xl object-cover shadow-sm" />
              <div>
                <p class="font-bold text-gray-900 text-sm">{{ currentRecipient?.name }}</p>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-green-500"></div>
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online</p>
                </div>
              </div>
            </div>
            <button class="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
              <MoreVertical class="w-5 h-5" />
            </button>
          </div>

          <!-- Messages List -->
          <div 
            ref="chatScroll" 
            class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 custom-scrollbar"
          >
            <div v-if="isLoadingChat" class="h-full flex items-center justify-center">
              <Loader2 class="w-8 h-8 text-primary animate-spin opacity-20" />
            </div>
            <template v-else>
              <div 
                v-for="(msg, index) in store.chatMessages" 
                :key="index"
                :class="['flex w-full', msg.sender_id === store.user.id ? 'justify-end' : 'justify-start']"
              >
                <div class="flex flex-col max-w-[75%] lg:max-w-[60%]">
                  <div 
                    :class="[
                      'px-5 py-3.5 rounded-3xl text-sm font-medium shadow-sm transition-all hover:shadow-md',
                      msg.sender_id === store.user.id 
                        ? (store.isAdmin ? 'bg-primary text-white rounded-tr-none' : 'bg-[#002147] text-white rounded-tr-none') 
                        : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                    ]"
                  >
                    {{ msg.content }}
                  </div>
                  <div 
                    :class="[
                      'mt-1.5 flex items-center gap-1.5 px-2',
                      msg.sender_id === store.user.id ? 'justify-end' : 'justify-start'
                    ]"
                  >
                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{{ formatTime(msg.created_at) }}</p>
                    <CheckCheck 
                      v-if="msg.sender_id === store.user.id" 
                      :class="['w-3 h-3transition-colors', msg.is_read ? 'text-blue-500' : 'text-gray-300']" 
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Chat Input -->
          <div class="p-6 bg-white border-t border-gray-100">
            <div class="flex items-center gap-4">
              <div class="flex-1 relative">
                <input 
                  v-model="messageInput"
                  @keyup.enter="handleSendMessage"
                  type="text" 
                  placeholder="Type your message..."
                  class="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
              </div>
              <button 
                @click="handleSendMessage"
                :disabled="!messageInput.trim()"
                :class="[
                  'p-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:scale-100',
                  store.isAdmin ? 'bg-primary text-white shadow-primary/20 hover:bg-red-800' : 'bg-[#002147] text-white shadow-[#002147]/20 hover:bg-slate-900'
                ]"
              >
                <Send class="w-5 h-5" />
              </button>
            </div>
          </div>
        </template>

        <!-- Empty State (No convo selected) -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
          <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <MessageSquare class="w-10 h-10 text-gray-400" />
          </div>
          <h2 class="text-2xl font-bold italic tracking-tight text-gray-900">Your Conversations</h2>
          <p class="text-sm font-medium text-gray-500 mt-2 max-w-sm">Connect with fellow students, share your campus experience, and build your community.</p>
          <button 
             @click="showContacts = true" 
             class="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            Start New Interaction
          </button>
        </div>
      </main>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* Float Animation */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
