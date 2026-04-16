<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
import axios from 'axios';
import { usePortalStore } from '../stores/portalStore';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Info,
  CreditCard,
  GraduationCap,
  Headphones
} from 'lucide-vue-next';

const store = usePortalStore();
const isOpen = ref(false);
const userInput = ref('');
const isTyping = ref(false);
const chatScroll = ref(null);
const chatMode = ref('ai'); // 'ai' or 'admin'
let pollTimer = null;

const messages = ref([
  {
    id: 1,
    role: 'bot',
    text: 'Hello! I am your CHCCI AI Assistant. How can I help you today?',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
]);

const suggestions = [
  { text: 'How to enroll?', icon: GraduationCap },
  { text: 'Payment methods?', icon: CreditCard },
  { text: 'What is the portal?', icon: Info }
];

const scrollToBottom = async () => {
  await nextTick();
  if (chatScroll.value) {
    chatScroll.value.scrollTop = chatScroll.value.scrollHeight;
  }
};

const startPolling = () => {
  if (pollTimer) return;
  fetchAdminMessages();
  pollTimer = setInterval(fetchAdminMessages, 5000);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const fetchAdminMessages = async () => {
  if (chatMode.value !== 'admin' || !isOpen.value) return;
  const oldLength = store.chatMessages.length;
  await store.fetchMyMessages();
  if (store.chatMessages.length > oldLength) {
    scrollToBottom();
  }
};

watch(chatMode, (newMode) => {
  if (newMode === 'admin' && isOpen.value) {
    startPolling();
  } else {
    stopPolling();
  }
});

watch(isOpen, (newOpen) => {
  if (newOpen && chatMode.value === 'admin') {
    startPolling();
  } else {
    stopPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

const handleSend = async (text) => {
  const content = text || userInput.value;
  if (!content.trim() || isTyping.value) return;

  if (chatMode.value === 'admin') {
    userInput.value = '';
    await store.sendToAdmin(content);
    scrollToBottom();
    return;
  }

  // AI BOT LOGIC
  messages.value.push({
    id: Date.now(),
    role: 'user',
    text: content,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  userInput.value = '';
  await scrollToBottom();

  isTyping.value = true;
  
  try {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
    const response = await axios.post(`${apiBase}/chat`, { 
      message: content 
    });
    
    isTyping.value = false;
    messages.value.push({
      id: Date.now() + 1,
      role: 'bot',
      text: response.data.response,
      category: response.data.category,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    isTyping.value = false;
    messages.value.push({
      id: Date.now() + 1,
      role: 'bot',
      text: "I'm having a bit of trouble connecting to the campus brain. Please try again in a moment!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  await scrollToBottom();
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) scrollToBottom();
};

const formatTime = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
    
    <!-- Chat Window / Box -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-10 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-10 opacity-0 scale-95"
    >
      <div v-if="isOpen" class="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        
        <!-- Chat Header -->
        <div class="p-6 bg-slate-900 text-white flex flex-col gap-4 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Bot v-if="chatMode === 'ai'" class="w-6 h-6 text-white" />
                <Headphones v-else class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="font-black text-sm tracking-tight text-white m-0 leading-none">
                  {{ chatMode === 'ai' ? 'Portal Assistant' : 'Admin Support' }}
                </h3>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Now</span>
                </div>
              </div>
            </div>
            <button @click="toggleChat" class="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X class="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <!-- Mode Toggle -->
          <div class="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              @click="chatMode = 'ai'"
              :class="['flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all', chatMode === 'ai' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white']"
            >
              <Sparkles :size="12" /> AI Bot
            </button>
            <button 
              @click="chatMode = 'admin'"
              :class="['flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all', chatMode === 'admin' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white']"
            >
              <Headphones :size="12" /> Admin
            </button>
          </div>
        </div>

        <!-- Chat Body -->
        <div ref="chatScroll" class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50">
          <!-- AI Mode Messages -->
          <template v-if="chatMode === 'ai'">
            <div v-for="msg in messages" :key="msg.id" :class="['flex w-full', msg.role === 'bot' ? 'justify-start' : 'justify-end']">
              <div :class="['flex max-w-[85%] gap-2', msg.role === 'user' ? 'flex-row-reverse' : '']">
                <div :class="['w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm', msg.role === 'bot' ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-100']">
                  <Bot v-if="msg.role === 'bot'" :size="16" />
                  <User v-else :size="16" />
                </div>
                <div class="space-y-1">
                  <div :class="['p-4 rounded-[1.5rem] text-sm leading-relaxed font-medium', msg.role === 'bot' ? 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm' : 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10']">
                    {{ msg.text }}
                  </div>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{{ msg.time }}</p>
                </div>
              </div>
            </div>
          </template>

          <!-- Admin Mode Messages -->
          <template v-else>
            <div v-for="msg in store.chatMessages" :key="msg.id" :class="['flex w-full', msg.sender_id === store.user?.id ? 'justify-end' : 'justify-start']">
              <div :class="['flex max-w-[85%] gap-2', msg.sender_id === store.user?.id ? 'flex-row-reverse' : '']">
                <div :class="['w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm', msg.sender_id === store.user?.id ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-100']">
                  <User v-if="msg.sender_id === store.user?.id" :size="16" />
                  <Headphones v-else :size="16" />
                </div>
                <div class="space-y-1">
                  <div :class="['p-4 rounded-[1.5rem] text-sm leading-relaxed font-medium', msg.sender_id === store.user?.id ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm']">
                    {{ msg.content }}
                  </div>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{{ formatTime(msg.created_at) }}</p>
                </div>
              </div>
            </div>
            <div v-if="store.chatMessages.length === 0" class="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
              <MessageCircle :size="48" class="mb-4" />
              <p class="text-xs font-bold uppercase tracking-widest">No messages yet. Ask the admin anything!</p>
            </div>
          </template>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="flex justify-start animate-in fade-in transition-all">
            <div class="flex gap-2 bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
              <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
              <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100"></span>
              <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        </div>

        <!-- Chat Footer / Suggestions -->
        <div class="p-6 bg-white border-t border-slate-100">
          <!-- Quick Suggestions (AI Only) -->
          <div v-if="chatMode === 'ai' && messages.length < 3" class="flex flex-wrap gap-2 mb-4">
             <button 
              v-for="s in suggestions" 
              :key="s.text"
              @click="handleSend(s.text)"
              class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 hover:border-primary hover:text-primary transition-all active:scale-95"
             >
               <component :is="s.icon" class="w-3.5 h-3.5" />
               {{ s.text }}
             </button>
          </div>
          
          <div class="relative">
            <input 
              v-model="userInput"
              @keyup.enter="handleSend()"
              type="text" 
              placeholder="Ask anything..." 
              class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-4 pr-12 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
            />
            <button 
              @click="handleSend()"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Send :size="18" />
            </button>
          </div>
        </div>

      </div>
    </transition>

    <!-- Floating Trigger Button -->
    <button 
      @click="toggleChat"
      :class="[
        'relative group p-4 rounded-[2rem] shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3',
        isOpen ? 'bg-primary text-white rotate-90 scale-90' : 'bg-slate-900 text-white'
      ]"
    >
      <!-- Pulse Effect -->
      <span v-if="!isOpen" class="absolute inset-0 bg-primary/20 rounded-[2rem] animate-ping duration-1000"></span>
      
      <MessageCircle v-if="!isOpen" class="w-8 h-8 relative z-10" />
      <X v-else class="w-8 h-8 relative z-10 -rotate-90" />
      
      <span v-if="!isOpen" class="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-black text-xs uppercase tracking-widest pl-0 group-hover:pl-2">
        Chat with Us
      </span>
    </button>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
</style>
