<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  Plus, 
  Image, 
  Smile, 
  Send, 
  History, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Megaphone,
  Loader2,
  RefreshCw,
  LayoutGrid
} from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';
import PostCard from '../components/PostCard.vue';

const store = usePortalStore();
const posts = ref([]);
const isLoading = ref(true);
const isRefreshing = ref(false);

const newPostContent = ref('');
const isSubmittingPost = ref(false);
const postType = ref('post'); // 'post' or 'announcement'

const fetchPosts = async () => {
  isLoading.value = true;
  posts.value = await store.fetchWallPosts();
  isLoading.value = false;
};

const refreshPosts = async () => {
  isRefreshing.value = true;
  posts.value = await store.fetchWallPosts();
  setTimeout(() => isRefreshing.value = false, 500);
};

const handleCreatePost = async () => {
  if (!newPostContent.value.trim()) return;
  
  isSubmittingPost.value = true;
  const result = await store.createWallPost(newPostContent.value, postType.value);
  
  if (result) {
    posts.value.unshift(result);
    newPostContent.value = '';
    postType.value = 'post'; // Reset to regular post
  }
  isSubmittingPost.value = false;
};

const handlePostDelete = (postId) => {
  posts.value = posts.value.filter(p => p.id !== postId);
};

const handlePostReact = (postId, reacted) => {
  const post = posts.value.find(p => p.id === postId);
  if (post) {
    post.user_reacted = reacted;
    post.reaction_count += reacted ? 1 : -1;
  }
};

onMounted(() => {
  fetchPosts();
});

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

const announcements = computed(() => posts.value.filter(p => p.type === 'announcement').slice(0, 3));
const recentThoughts = computed(() => posts.value.filter(p => p.type === 'post').slice(0, 5));
</script>

<template>
  <div class="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
    
    <!-- Professional Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 mb-3">
          <CheckCircle2 :size="14" />
          <span class="text-[10px] font-black uppercase tracking-widest">Official Campus Wall</span>
        </div>
        <h1 class="text-3xl font-black text-[#002147] tracking-tight">Student Community</h1>
        <p class="text-slate-500 text-sm font-medium mt-1">Connect, share thoughts, and stay updated with the latest campus news.</p>
      </div>

      <div class="flex items-center gap-3">
        <button 
          @click="refreshPosts" 
          :disabled="isRefreshing"
          class="p-3 bg-white border border-slate-100 rounded-2xl text-[#002147] hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw :size="20" :class="{ 'animate-spin': isRefreshing }" />
        </button>
        <div class="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1">
          <div class="px-4 py-2 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <LayoutGrid :size="14" /> Feed View
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <!-- Left Sidebar: Profile Summary (Desktop) -->
      <div class="hidden lg:col-span-3 lg:flex flex-col gap-6 sticky top-24">
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
           <img :src="store.user?.avatar" class="w-20 h-20 rounded-3xl mx-auto mb-4 border-4 border-white ring-2 ring-slate-50 shadow-lg object-cover" />
           <h3 class="text-base font-black text-[#002147]">{{ store.user?.name }}</h3>
           <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ store.user?.program }} • {{ store.user?.year }}</p>
           
           <div class="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
             <div>
               <p class="text-xl font-black text-[#002147]">{{ posts.filter(p => p.user_id === store.user?.id).length }}</p>
               <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Posts</p>
             </div>
             <div>
               <p class="text-xl font-black text-[#002147]">{{ store.unreadNotifications }}</p>
               <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Alerts</p>
             </div>
           </div>
        </div>

        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <TrendingUp :size="14" /> Guidelines
          </h4>
          <ul class="space-y-4 text-xs font-medium text-slate-500">
            <li class="flex gap-3">
              <span class="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-1.5 shrink-0"></span>
              Be respectful to fellow students.
            </li>
            <li class="flex gap-3">
              <span class="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-1.5 shrink-0"></span>
              Keep feedback constructive.
            </li>
            <li class="flex gap-3">
              <span class="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-1.5 shrink-0"></span>
              Ads and spam are not allowed.
            </li>
          </ul>
        </div>
      </div>

      <!-- Center: Post Creation & Feed -->
      <div class="col-span-1 lg:col-span-6 space-y-6">
        
        <!-- Create Post Area -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div class="flex gap-4">
            <img :src="store.user?.avatar" class="w-10 h-10 rounded-xl object-cover shrink-0 shadow-inner" />
            <div class="flex-1">
              <textarea 
                v-model="newPostContent"
                placeholder="Share your thoughts or feelings about campus life..." 
                class="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-[#002147] min-h-[100px] border border-transparent transition-all placeholder:text-slate-400 resize-none"
              ></textarea>
              
              <div class="flex items-center justify-between mt-4">
                <div class="flex items-center gap-2">
                  <button class="p-2 text-slate-400 hover:text-emerald-500 rounded-xl hover:bg-emerald-50 transition-colors tooltip" title="Add Image">
                    <Image :size="20" />
                  </button>
                  <button class="p-2 text-slate-400 hover:text-amber-500 rounded-xl hover:bg-amber-50 transition-colors tooltip" title="Add Emoji">
                    <Smile :size="20" />
                  </button>
                  
                  <div v-if="isAdmin" class="ml-2 pl-4 border-l border-slate-100 flex items-center gap-2">
                    <button 
                      @click="postType = (postType === 'announcement' ? 'post' : 'announcement')"
                      :class="['px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', postType === 'announcement' ? 'bg-[#D4AF37] text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100']"
                    >
                      <Megaphone :size="12" class="inline-block mr-1" /> Announcement
                    </button>
                  </div>
                </div>

                <button 
                  @click="handleCreatePost"
                  :disabled="!newPostContent.trim() || isSubmittingPost"
                  class="bg-[#002147] text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#003366] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-[#002147]/10"
                >
                  <Send v-if="!isSubmittingPost" :size="16" />
                  <Loader2 v-else :size="16" class="animate-spin" />
                  {{ isSubmittingPost ? 'Posting...' : 'Post Now' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Feed List -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
           <Loader2 class="w-12 h-12 text-[#002147] animate-spin opacity-20" />
           <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gathering the latest campus vibes...</p>
        </div>
        
        <div v-else-if="posts.length > 0" class="space-y-6">
          <PostCard 
            v-for="post in posts" 
            :key="post.id" 
            :post="post" 
            @delete="handlePostDelete"
            @react="handlePostReact"
          />
        </div>

        <div v-else class="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
           <History class="w-16 h-16 text-slate-100 mx-auto mb-6" />
           <h3 class="text-xl font-black text-[#002147]">The Wall is Quiet...</h3>
           <p class="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Be the first to share your thoughts, exam feelings, or academic highlights!</p>
        </div>
      </div>

      <!-- Right Sidebar: Stats & Highlights (Desktop) -->
      <div class="hidden lg:col-span-3 xl:flex flex-col gap-8 sticky top-24">
        
        <!-- Announcements Spotlight -->
        <div v-if="announcements.length > 0" class="space-y-4">
           <h4 class="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
             <AlertCircle :size="16" /> Top Announcements
           </h4>
           <div class="space-y-3">
             <div v-for="ann in announcements" :key="'sp-'+ann.id" class="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
               <p class="text-xs font-black text-slate-400 mb-1 font-mono uppercase">{{ formatTime(ann.created_at) }}</p>
               <p class="text-xs text-[#002147] font-bold line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{{ ann.content }}</p>
             </div>
           </div>
        </div>

        <!-- Campus Pulse -->
        <div class="bg-[#002147] rounded-3xl p-6 text-white overflow-hidden relative shadow-2xl shadow-[#002147]/30">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          
          <div class="relative z-10">
            <h4 class="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-6">Campus Pulse</h4>
            <div class="space-y-6">
               <div class="flex items-center justify-between">
                 <p class="text-xs font-bold text-white/70">Total Interactions</p>
                 <p class="font-black text-lg">{{ posts.reduce((acc, p) => acc + p.reaction_count + p.comment_count, 0) }}</p>
               </div>
               <div class="flex items-center justify-between">
                 <p class="text-xs font-bold text-white/70">Daily Post Volume</p>
                 <p class="font-black text-lg">+{{ posts.filter(p => new Date(p.created_at) > new Date(Date.now() - 86400000)).length }}</p>
               </div>
            </div>
            <div class="mt-8 pt-6 border-t border-white/10 text-center">
              <p class="text-[9px] font-black italic text-[#D4AF37]">Driven by CHCCI Al Support</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tooltip { cursor: help; }
</style>
