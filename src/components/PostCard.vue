<script setup>
import { ref, computed } from 'vue';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Trash2, 
  Megaphone,
  User,
  Send,
  CheckCircle,
  Clock
} from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';

const props = defineProps({
  post: { type: Object, required: true }
});

const emit = defineEmits(['delete', 'react']);

const store = usePortalStore();
const showComments = ref(false);
const comments = ref([]);
const newComment = ref('');
const isSubmittingComment = ref(false);
const showMenu = ref(false);

const isAuthor = computed(() => store.user?.id === props.post.user_id);
const isAdmin = computed(() => store.isAdmin);

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const handleReact = async () => {
  const result = await store.togglePostReaction(props.post.id);
  if (result) {
    emit('react', props.post.id, result.reacted);
  }
};

const toggleComments = async () => {
  showComments.value = !showComments.value;
  if (showComments.value && comments.value.length === 0) {
    loadComments();
  }
};

const loadComments = async () => {
  const data = await store.fetchPostComments(props.post.id);
  comments.value = data;
};

const submitComment = async () => {
  if (!newComment.value.trim()) return;
  isSubmittingComment.value = true;
  const result = await store.addPostComment(props.post.id, newComment.value);
  if (result) {
    comments.value.push(result);
    newComment.value = '';
    props.post.comment_count++;
  }
  isSubmittingComment.value = false;
};

const deletePost = async () => {
  if (confirm('Are you sure you want to delete this post?')) {
    const success = await store.deleteWallPost(props.post.id);
    if (success) {
      emit('delete', props.post.id);
    }
  }
};

const sharePost = () => {
  navigator.clipboard.writeText(`${window.location.origin}/dashboard/wall?post=${props.post.id}`);
  alert('Link copied to clipboard!');
};
</script>

<template>
  <div 
    class="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    :class="{ 'border-l-4 border-l-[#D4AF37]': post.type === 'announcement' }"
  >
    <!-- Post Header -->
    <div class="p-5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="relative">
          <img :src="post.author_avatar" class="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-50" />
          <div v-if="post.author_role === 'admin'" class="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full ring-2 ring-white">
            <CheckCircle :size="10" fill="currentColor" class="text-white" />
          </div>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h4 class="font-black text-sm text-[#002147] leading-none">{{ post.author_name }}</h4>
            <span v-if="post.type === 'announcement'" class="bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
              <Megaphone :size="10" /> Announcement
            </span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock :size="10" /> {{ formatTime(post.created_at) }}
            </span>
            <span class="text-[10px] text-slate-300">•</span>
            <span class="text-[10px] font-black text-slate-400 uppercase">{{ post.user_id === 'admin@chcci.edu.ph' ? 'Management' : 'Student' }}</span>
          </div>
        </div>
      </div>

      <div class="relative">
        <button @click="showMenu = !showMenu" class="p-2 text-slate-400 hover:text-[#002147] rounded-xl hover:bg-slate-50 transition-colors">
          <MoreHorizontal :size="20" />
        </button>
        
        <div v-if="showMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in zoom-in-95 duration-200">
           <button v-if="isAuthor || isAdmin" @click="deletePost" class="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
             <Trash2 :size="16" /> Delete Post
           </button>
           <button @click="sharePost" class="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
             <Share2 :size="16" /> Copy Link
           </button>
        </div>
        <div v-if="showMenu" @click="showMenu = false" class="fixed inset-0 z-40"></div>
      </div>
    </div>

    <!-- Post Content -->
    <div class="px-5 pb-5">
      <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">{{ post.content }}</p>
      
      <div v-if="post.image_url" class="mt-4 rounded-2xl overflow-hidden border border-slate-100">
        <img :src="post.image_url" class="w-full h-auto object-cover max-h-96" />
      </div>
    </div>

    <!-- Stats -->
    <div class="px-5 py-3 border-t border-slate-50 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button 
          @click="handleReact"
          class="flex items-center gap-1.5 transition-all active:scale-95 group"
          :class="post.user_reacted ? 'text-red-500' : 'text-slate-400 hover:text-red-500'"
        >
          <div :class="['p-1.5 rounded-lg transition-colors', post.user_reacted ? 'bg-red-50' : 'group-hover:bg-red-50']">
            <Heart :size="18" :fill="post.user_reacted ? 'currentColor' : 'none'" />
          </div>
          <span class="text-xs font-black">{{ post.reaction_count || 0 }}</span>
        </button>

        <button 
          @click="toggleComments"
          class="flex items-center gap-1.5 transition-all hover:text-[#002147] text-slate-400 group"
        >
          <div class="p-1.5 rounded-lg group-hover:bg-blue-50 transition-colors">
            <MessageCircle :size="18" />
          </div>
          <span class="text-xs font-black">{{ post.comment_count || 0 }}</span>
        </button>
      </div>

      <button @click="sharePost" class="p-2 text-slate-400 hover:text-[#002147] rounded-xl hover:bg-slate-50 transition-colors">
        <Share2 :size="18" />
      </button>
    </div>

    <!-- Comments Section -->
    <div v-if="showComments" class="bg-slate-50/50 border-t border-slate-50 p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
      <!-- Comment List -->
      <div v-if="comments.length > 0" class="space-y-4">
        <div v-for="comment in comments" :key="comment.id" class="flex gap-3">
          <img :src="comment.avatar" class="w-8 h-8 rounded-xl object-cover shrink-0 ring-2 ring-white" />
          <div class="flex-1">
            <div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100/50">
              <h5 class="text-[11px] font-black text-[#002147] leading-none mb-1">{{ comment.name }}</h5>
              <p class="text-xs text-slate-600 font-medium leading-relaxed">{{ comment.content }}</p>
            </div>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-1">{{ formatTime(comment.created_at) }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="!isSubmittingComment" class="text-center py-4">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No comments yet. Be the first!</p>
      </div>

      <!-- Add Comment -->
      <div class="flex items-center gap-3 pt-2">
        <img :src="store.user?.avatar" class="w-8 h-8 rounded-xl object-cover shrink-0 ring-2 ring-white shadow-sm" />
        <div class="flex-1 relative">
          <input 
            v-model="newComment"
            @keyup.enter="submitComment"
            placeholder="Write a comment..." 
            class="w-full bg-white border border-slate-100 rounded-xl py-2 px-4 pr-10 text-xs font-medium focus:outline-none focus:border-[#002147] shadow-inner"
          />
          <button 
            @click="submitComment"
            :disabled="!newComment.trim() || isSubmittingComment"
            class="absolute right-2 inset-y-0 text-slate-400 hover:text-[#002147] disabled:opacity-30 transition-colors"
          >
            <Send :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ring-white { --tw-ring-color: #ffffff; }
</style>
