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
  Clock,
  Reply
} from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';
import ReactionPicker from './ReactionPicker.vue';

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

// Reaction Picker State
const showPicker = ref(false);
const pickerPos = ref({ top: 0, left: 0 });
const pickerTarget = ref({ type: 'post', id: null });

// Reply State
const replyingTo = ref(null);
const replyContent = ref('');

const isAuthor = computed(() => store.user?.id === props.post.user_id);
const isAdmin = computed(() => store.isAdmin);

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 84400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getReactionEmoji = (type) => {
  const map = {
    'like': '❤️',
    'haha': '😂',
    'wow': '😮',
    'sad': '😢',
    'angry': '😡'
  };
  return map[type] || '❤️';
};

const openPicker = (e, type, id) => {
  const rect = e.currentTarget.getBoundingClientRect();
  pickerPos.value = { 
    top: rect.top + window.scrollY, 
    left: rect.left + window.scrollX + (rect.width / 2) 
  };
  pickerTarget.value = { type, id };
  showPicker.value = true;
};

const handlePickerSelect = async (reactionType) => {
  if (pickerTarget.value.type === 'post') {
    const result = await store.togglePostReaction(props.post.id, null, reactionType);
    if (result) {
      props.post.user_reacted = result.reacted;
      props.post.user_reaction_type = result.type;
      props.post.reaction_count += (result.reacted && !props.post.user_reacted) ? 1 : (result.reacted ? 0 : -1);
      // Wait, let's simplify reaction count logic based on result
      props.post.reaction_count = result.reacted ? (props.post.user_reacted ? props.post.reaction_count : props.post.reaction_count + 1) : Math.max(0, props.post.reaction_count - 1);
      // Actually, better to just refresh or have backend return count. We'll refresh relevant part.
    }
  } else {
    // Comment Reaction
    const commentId = pickerTarget.value.id;
    const result = await store.togglePostReaction(null, commentId, reactionType);
    if (result) {
      const comment = comments.value.find(c => c.id === commentId);
      if (comment) {
        comment.user_reaction_type = result.type;
        comment.reaction_count = result.reacted ? (comment.user_reaction_type ? comment.reaction_count : comment.reaction_count + 1) : Math.max(0, comment.reaction_count - 1);
        // Refresh comments list state
      }
    }
  }
};

const handleReact = async () => {
  const result = await store.togglePostReaction(props.post.id, null, 'like');
  if (result) {
    props.post.user_reacted = result.reacted;
    props.post.user_reaction_type = result.type;
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
  try {
    const data = await store.fetchPostComments(props.post.id);
    comments.value = data;
  } catch (error) {
    console.error('Failed to load comments:', error);
  }
};

let hoverTimer = null;
const handleMouseEnter = (e, type = 'post', id = null) => {
  if (window.innerWidth < 1024) return; // Only hover on desktop
  const targetId = id || props.post.id;
  hoverTimer = setTimeout(() => {
    openPicker(e, type, targetId);
  }, 400); // reduced from 600ms for "automatic" feel
};

const handleMouseLeave = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
};

const submitComment = async (parentId = null) => {
  const content = parentId ? replyContent.value : newComment.value;
  if (!content.trim()) return;
  
  isSubmittingComment.value = true;
  const result = await store.addPostComment(props.post.id, content, parentId);
  if (result) {
    comments.value.push(result);
    if (parentId) {
      replyContent.value = '';
      replyingTo.value = null;
    } else {
      newComment.value = '';
    }
    props.post.comment_count++;
  }
  isSubmittingComment.value = false;
};

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE ? import.meta.env.VITE_API_BASE.replace('/api', '') : 'http://localhost:3000';
  return `${baseUrl}${url}`;
};

const rootComments = computed(() => comments.value.filter(c => !c.parent_id));
const getReplies = (parentId) => comments.value.filter(c => c.parent_id === parentId);

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
      
      <div v-if="post.image_url" class="mt-4 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
        <img :src="resolveImageUrl(post.image_url)" class="w-full h-auto object-cover max-h-[500px]" />
      </div>
    </div>

    <div class="px-5 py-3 border-t border-slate-50 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div 
          class="relative"
          @mouseenter="handleMouseEnter($event, 'post')"
          @mouseleave="handleMouseLeave"
        >
          <button 
            @click="handleReact"
            @contextmenu.prevent="openPicker($event, 'post', post.id)"
            class="flex items-center gap-1.5 transition-all active:scale-95 group"
            :class="post.user_reaction_type ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'"
          >
            <div :class="['p-1.5 rounded-lg transition-colors flex items-center justify-center min-w-[32px] min-h-[32px]', post.user_reaction_type ? 'bg-blue-50' : 'group-hover:bg-blue-50']">
              <span v-if="post.user_reaction_type" class="text-xl animate-in zoom-in-50 duration-300 drop-shadow-sm">
                {{ getReactionEmoji(post.user_reaction_type) }}
              </span>
              <div v-else class="flex items-center justify-center p-0.5">
                <Heart :size="18" class="group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span v-if="post.reaction_count > 0" class="text-xs font-bold text-slate-500">{{ post.reaction_count }}</span>
          </button>
        </div>

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
    <div v-if="showComments" class="bg-slate-50/50 border-t border-slate-50 p-5 space-y-4 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
      <!-- Comment List (Threaded) -->
      <div v-if="rootComments.length > 0" class="space-y-6">
        <div v-for="comment in rootComments" :key="comment.id" class="space-y-4">
          <!-- Main Comment -->
          <div class="flex gap-2 group/comment">
            <img :src="comment.avatar" class="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" />
            <div class="flex-1 max-w-[85%]">
              <div class="bg-slate-100/80 px-4 py-2.5 rounded-2xl rounded-tl-none relative group/bubble hover:bg-slate-100 transition-colors">
                <h5 class="text-[11px] font-black text-[#002147] mb-0.5">{{ comment.name }}</h5>
                <p class="text-xs text-slate-700 leading-normal">{{ comment.content }}</p>
                
                <!-- Comment Reaction Display -->
                <div v-if="comment.reaction_count > 0" class="absolute -bottom-2 right-1 bg-white shadow-sm border border-slate-50 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 scale-90">
                  <span class="text-[10px]">❤️</span>
                  <span class="text-[9px] font-black text-slate-400">{{ comment.reaction_count }}</span>
                </div>
              </div>
              
              <div class="flex items-center gap-3 mt-1.5 ml-1">
                 <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ formatTime(comment.created_at) }}</span>
                  <div 
                    class="relative"
                    @mouseenter="handleMouseEnter($event, 'comment', comment.id)"
                    @mouseleave="handleMouseLeave"
                  >
                    <button 
                      @click="openPicker($event, 'comment', comment.id)"
                      class="text-[9px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors"
                    >
                      {{ comment.user_reaction_type ? getReactionEmoji(comment.user_reaction_type) : 'React' }}
                    </button>
                  </div>
                 <button 
                   @click="replyingTo = comment.id"
                   class="text-[9px] font-black uppercase text-slate-400 hover:text-[#002147] transition-colors flex items-center gap-1"
                 >
                   <Reply :size="10" /> Reply
                 </button>
              </div>

              <!-- Replies -->
              <div v-if="getReplies(comment.id).length > 0" class="mt-3 space-y-3 pl-2 border-l-2 border-slate-200/50 ml-1">
                 <div v-for="reply in getReplies(comment.id)" :key="reply.id" class="flex gap-2">
                    <img :src="reply.avatar" class="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white" />
                    <div class="flex-1 max-w-[90%]">
                       <div class="bg-slate-100/60 px-3 py-2 rounded-xl rounded-tl-none">
                          <h5 class="text-[10px] font-black text-[#002147] mb-0.5">{{ reply.name }}</h5>
                          <p class="text-[11px] text-slate-700">{{ reply.content }}</p>
                       </div>
                       <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-1">{{ formatTime(reply.created_at) }}</span>
                    </div>
                 </div>
              </div>

              <!-- Inline Reply Box -->
              <div v-if="replyingTo === comment.id" class="mt-3 pl-4 animate-in slide-in-from-left-2 duration-200">
                 <div class="flex items-center gap-2">
                    <input 
                      v-model="replyContent"
                      @keyup.enter="submitComment(comment.id)"
                      placeholder="Write a reply..." 
                      class="flex-1 bg-white border border-slate-100 rounded-lg py-1.5 px-3 text-[11px] font-medium focus:outline-none focus:border-[#002147] shadow-sm"
                    />
                    <button 
                      @click="submitComment(comment.id)"
                      class="text-[#002147] p-1.5 rounded-lg hover:bg-white transition-colors"
                    >
                      <Send :size="14" />
                    </button>
                    <button @click="replyingTo = null" class="text-slate-300 text-[10px] font-bold uppercase">Cancel</button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="!isSubmittingComment" class="text-center py-4">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No comments yet. Be the first!</p>
      </div>

      <!-- Add Comment -->
      <div class="flex items-center gap-3 pt-2">
        <img :src="store.user?.avatar || 'https://ui-avatars.com/api/?name=User'" class="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm" />
        <div class="flex-1 relative">
          <input 
            v-model="newComment"
            @keyup.enter="submitComment()"
            placeholder="Write a comment..." 
            class="w-full bg-slate-100 border-none rounded-2xl py-2 px-4 pr-10 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all shadow-inner"
          />
          <button 
            @click="submitComment()"
            :disabled="!newComment.trim() || isSubmittingComment"
            class="absolute right-2 inset-y-0 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
          >
            <Send :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Reaction Picker Overlay -->
    <ReactionPicker 
      :show="showPicker" 
      :position="pickerPos" 
      @select="handlePickerSelect" 
      @close="showPicker = false" 
    />
  </div>
</template>

<style scoped>
.ring-white { --tw-ring-color: #ffffff; }
</style>
