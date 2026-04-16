<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { useRouter, useRoute } from 'vue-router';
import { 
  Users, UserPlus, Search, Edit2, Trash2, LogOut, LayoutDashboard, 
  BarChart3, Settings, Bell, Wallet, TrendingUp, ShieldAlert, Save, 
  CheckCircle2, Building2, Megaphone, BookOpen, Loader2, MessageSquare,
  Send, UserIcon, CheckCircle, X, Plus, CheckCheck, ChevronRight
} from 'lucide-vue-next';
import AdminStudentModal from '../components/AdminStudentModal.vue';
import SkeletonLoader from '../components/SkeletonLoader.vue';
import UserAvatar from '../components/UserAvatar.vue';

const store = usePortalStore();
const router = useRouter();
const route = useRoute();
const currentView = ref('dashboard'); // 'dashboard', 'students', 'analytics', 'messages', 'settings', 'org_requests'
const searchQuery = ref('');
const isModalOpen = ref(false);
const editingStudent = ref(null);
const initialTab = ref('info');
const stats = ref({ totalStudents: 0, totalBalance: 0, programDistribution: [] });
const isNotificationOpen = ref(false);
const isGeneratingReport = ref(false);
const isLoadingData = ref(true);

const selectedStudentId = ref(null);
const adminMessageInput = ref('');
const chatScroll = ref(null);
const messageContainer = ref(null);
let conversationsPoll = null;
let chatPoll = null;

const notifications = ref([
  { id: 1, title: 'New Enrollment', message: 'John Doe has completed registration.', time: '2 mins ago', unread: true },
  { id: 2, title: 'System Alert', message: 'Database backup completed successfully.', time: '1 hour ago', unread: false },
]);

onMounted(() => {
  const queryView = route.query.view;
  const validViews = ['dashboard', 'students', 'analytics', 'messages', 'settings', 'org_requests'];
  if (queryView && validViews.includes(queryView)) {
    currentView.value = queryView;
  }
  loadAllData();
  startConversationsPolling();
  store.fetchOrgApplications();
});

const setView = (v) => {
  console.log('Navigating to:', v);
  currentView.value = v;
  isNotificationOpen.value = false;
  router.push({ query: { ...route.query, view: v } });
};

// Sync view with URL query changes
watch(() => route.query.view, (newView) => {
  const validViews = ['dashboard', 'students', 'analytics', 'messages', 'settings', 'org_requests'];
  if (newView && validViews.includes(newView)) {
    currentView.value = newView;
  } else if (!newView) {
    currentView.value = 'dashboard';
  }
});

watch(currentView, (newView) => {
  if (newView === 'messages') {
    startConversationsPolling();
  } else {
    stopConversationsPolling();
    stopChatPolling();
  }
});

const startConversationsPolling = () => {
  if (conversationsPoll) return;
  store.fetchMyMessages();
  conversationsPoll = setInterval(() => store.fetchMyMessages(), 5000);
};

const stopConversationsPolling = () => {
  if (conversationsPoll) {
    clearInterval(conversationsPoll);
    conversationsPoll = null;
  }
};

const startChatPolling = (studentId) => {
  stopChatPolling();
  selectedStudentId.value = studentId;
  fetchChat();
  chatPoll = setInterval(fetchChat, 3000);
};

const stopChatPolling = () => {
  if (chatPoll) {
    clearInterval(chatPoll);
    chatPoll = null;
  }
};

const fetchChat = async () => {
  if (!selectedStudentId.value) return;
  const oldLength = store.chatMessages.length;
  await store.fetchPeerChat(selectedStudentId.value);
  if (store.chatMessages.length > oldLength) {
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  if (messageContainer.value) {
    setTimeout(() => {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }, 100);
  }
};

const handleApproveApp = async (appId) => {
  await store.updateOrgApplicationStatus(appId, 'active');
};

const handleRejectApp = async (appId) => {
  await store.updateOrgApplicationStatus(appId, 'rejected');
};

const handleSendAdminMessage = async () => {
  if (!adminMessageInput.value.trim() || !selectedStudentId.value) return;
  const content = adminMessageInput.value;
  adminMessageInput.value = '';
  await store.sendMessage(selectedStudentId.value, content);
  scrollToBottom();
};

const formatTime = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const markAllRead = () => {
  notifications.value.forEach(n => n.unread = true);
  isNotificationOpen.value = false;
};

const handleGenerateReport = async () => {
  isGeneratingReport.value = true;
  const success = await store.downloadReport();
  isGeneratingReport.value = false;
  if (!success) alert('Failed to generate report. Please try again.');
};

const loadAllData = async () => {
  isLoadingData.value = true;
  try {
    await store.fetchStudents();
    const statsData = await store.fetchAdminStats();
    if (statsData) stats.value = statsData;
  } catch (err) {
    console.error('Data Load Error', err);
  } finally {
    isLoadingData.value = false;
  }
};

const handleAddStudent = () => {
  editingStudent.value = null;
  initialTab.value = 'info';
  isModalOpen.value = true;
};

const handleEdit = (student, tab = 'info') => {
  editingStudent.value = student;
  initialTab.value = tab;
  isModalOpen.value = true;
};

const handleDelete = async (id) => {
  if (confirm('Are you sure you want to delete this student? All their subject records and wall posts will also be permanently removed.')) {
    const result = await store.deleteStudent(id);
    if (result.success) {
      alert(result.message);
      await loadAllData();
    } else {
      alert(result.message);
    }
  }
};

const handleSignOut = () => {
  store.signOut();
};

const filteredStudents = computed(() => {
  return store.students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    s.id.includes(searchQuery.value)
  );
});

const getProgramPercentage = (count) => {
  if (!stats.value.totalStudents) return 0;
  return Math.round((count / stats.value.totalStudents) * 100);
};
</script>

<template>
  <div class="min-h-full">
    <div class="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <!-- Header Section -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight capitalize">
            Admin <span class="text-primary italic">{{ currentView }}</span>
          </h1>
          <p class="text-gray-500 mt-1 flex items-center gap-2">
            <Building2 class="w-4 h-4 text-primary" />
            Concepcion Holy Cross College Inc. Central Administration
          </p>
        </div>
        
        <!-- Quick Actions / View Switcher (Old School Tabs) -->
        <div class="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <button 
            v-for="view in ['dashboard', 'students', 'analytics', 'messages', 'org_requests', 'settings']" 
            :key="view"
            @click="setView(view)"
            :class="['px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300', currentView === view ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-gray-400 hover:text-gray-900']"
          >
            {{ view === 'org_requests' ? 'Requests' : view }}
          </button>
        </div>
      </header>

      <!-- VIEW: DASHBOARD -->
      <div v-if="currentView === 'dashboard'" class="space-y-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            <div class="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm"><Users :size="24" /></div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enrolled Students</p>
            <h3 class="text-3xl font-black text-gray-900 mt-1">
              <SkeletonLoader :is-loading="isLoadingData" type="text" class="w-16 h-8 rounded-lg inline-block">
                {{ stats.totalStudents }}
              </SkeletonLoader>
            </h3>
            <div class="mt-3 flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-lg uppercase"><TrendingUp :size="12" /> +12% Growth</div>
          </div>

          <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            <div class="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm"><Wallet :size="24" /></div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outstanding Balance</p>
            <h3 class="text-3xl font-black text-gray-900 mt-1">
              <SkeletonLoader :is-loading="isLoadingData" type="text" class="w-24 h-8 rounded-lg inline-block">
                ₱{{ (stats.totalBalance || 0).toLocaleString() }}
              </SkeletonLoader>
            </h3>
            <div class="mt-3 flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/5 w-fit px-2 py-1 rounded-lg uppercase"><CheckCircle2 :size="12" /> Stable Collection</div>
          </div>

          <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
            <div class="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm"><ShieldAlert :size="24" /></div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Critical Average</p>
            <h3 class="text-3xl font-black text-gray-900 mt-1">
              <SkeletonLoader :is-loading="isLoadingData" type="text" class="w-16 h-8 rounded-lg inline-block">
                {{ stats.criticalAverage || '0.00' }}
              </SkeletonLoader>
            </h3>
            <div class="mt-3 flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 w-fit px-2 py-1 rounded-lg uppercase"><TrendingUp :size="12" /> Grade Alert</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <!-- Recent Activity -->
           <section class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <div class="flex items-center justify-between mb-6">
               <h3 class="text-xl font-bold text-gray-800 tracking-tight">Recent Enrollments</h3>
               <button @click="setView('students')" class="text-sm font-bold text-primary hover:underline">View All</button>
             </div>
             <div class="space-y-4">
                <template v-if="isLoadingData">
                  <div v-for="i in 4" :key="i" class="h-16 rounded-2xl">
                     <SkeletonLoader :is-loading="true" type="rect" />
                  </div>
                </template>
                <div v-else v-for="s in store.students.slice(0, 4)" :key="s.id" class="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-50 group hover:bg-white hover:border-primary/20 transition-all">
                  <div class="flex items-center gap-3">
                   <div class="relative">
                      <UserAvatar :name="s.name" :avatar="s.avatar" size="w-10 h-10" role="student" />
                   </div>
                    <div>
                      <p class="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{{ s.name }}</p>
                      <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{{ s.program }} • {{ s.id }}</p>
                    </div>
                  </div>
                  <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Just Now</span>
                </div>
             </div>
           </section>

           <!-- Program Snapshot -->
           <section class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 class="text-xl font-bold text-gray-800 tracking-tight mb-6">Program Popularity</h3>
              <div class="space-y-6">
                <div v-for="prog in stats.programDistribution" :key="prog.program" class="space-y-2">
                   <div class="flex justify-between items-end">
                      <span class="text-xs font-bold text-gray-700">{{ prog.program }}</span>
                      <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{{ prog.count }} Students</span>
                   </div>
                   <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full bg-primary rounded-full transition-all duration-1000" :style="{ width: getProgramPercentage(prog.count) + '%' }"></div>
                   </div>
                </div>
              </div>
           </section>
        </div>
      </div>

      <!-- VIEW: STUDENTS -->
      <div v-if="currentView === 'students'" class="space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="relative w-full max-w-md group">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" :size="20" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search students..."
              class="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all shadow-sm font-bold text-gray-700 text-sm"
            >
          </div>
          <button @click="handleAddStudent" class="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-red-800 text-white px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-primary/20 active:scale-95">
            <UserPlus :size="18" /> Enroll Student
          </button>
        </div>

        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th class="px-6 py-4">Student</th>
                  <th class="px-6 py-4">Course</th>
                  <th class="px-6 py-4">Balance</th>
                  <th class="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50/50 transition-all group">
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                     <UserAvatar :name="student.name" :avatar="student.avatar" size="w-10 h-10" role="student" />
                      <div>
                        <div class="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{{ student.name }}</div>
                        <div class="text-[9px] font-bold text-gray-400 font-mono tracking-widest">{{ student.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div class="text-xs font-bold text-gray-700">{{ student.program }}</div>
                    <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{{ student.year }}</div>
                  </td>
                  <td class="px-6 py-5">
                     <div class="text-sm font-black" :class="student.balance > 0 ? 'text-gray-800' : 'text-green-600'">
                       ₱{{ (student.balance || 0).toLocaleString() }}
                     </div>
                  </td>
                  <td class="px-6 py-5 text-right whitespace-nowrap">
                    <div class="flex justify-end gap-1.5">
                      <button @click="handleEdit(student, 'subjects')" class="p-2 bg-gray-50 text-gray-600 hover:bg-primary hover:text-white rounded-lg transition-all" title="Subjects">
                        <BookOpen :size="16" />
                      </button>
                      <button @click="handleEdit(student, 'info')" class="p-2 bg-gray-50 text-gray-600 hover:bg-primary-dark hover:text-white rounded-lg transition-all" title="Edit">
                        <Edit2 :size="16" />
                      </button>
                      <button @click="handleDelete(student.id)" class="p-2 bg-gray-50 text-gray-600 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Delete">
                        <Trash2 :size="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="filteredStudents.length === 0" class="py-16 text-center text-gray-400">
             <Search :size="48" class="mx-auto mb-4 opacity-20" />
             <p class="font-bold">No students found.</p>
          </div>
        </div>
      </div>

      <!-- VIEW: ANALYTICS -->
      <div v-if="currentView === 'analytics'" class="space-y-8">
         <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <section class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <h3 class="text-xl font-bold text-gray-800 tracking-tight mb-4">Enrollment Distribution</h3>
             <p class="text-sm text-gray-500 mb-8">Breakdown of students based on academic program.</p>
             
             <div class="flex items-end justify-between gap-4 h-48 px-2">
               <div v-for="prog in stats.programDistribution" :key="prog.program" class="flex-1 flex flex-col items-center justify-end gap-2 h-full group">
                  <div class="w-full bg-primary/10 rounded-t-xl group-hover:bg-primary/20 transition-all border-b border-primary/30" :style="{ height: getProgramPercentage(prog.count) + '%' }"></div>
                  <span class="text-[8px] font-bold text-gray-400 uppercase tracking-tighter text-center h-8 flex items-center leading-tight">{{ prog.program }}</span>
               </div>
             </div>
           </section>

           <section class="bg-primary p-8 rounded-3xl text-white shadow-lg relative overflow-hidden group">
             <div class="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
             <div class="relative z-10 space-y-8">
                <div>
                  <h3 class="text-xl font-bold tracking-tight mb-2">Financial Insights</h3>
                  <p class="text-xs text-white/70 font-medium">Snapshot of outstanding collectibles.</p>
                </div>

                <div class="space-y-6">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><Wallet :size="24" /></div>
                    <div>
                      <p class="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total Outstanding</p>
                      <h4 class="text-3xl font-black italic">₱{{ (stats.totalBalance || 0).toLocaleString() }}</h4>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p class="text-[8px] font-bold text-white/50 uppercase tracking-widest">Avg / Student</p>
                      <h5 class="text-lg font-bold">₱{{ Math.round((stats.totalBalance || 0) / (stats.totalStudents || 1)).toLocaleString() }}</h5>
                    </div>
                    <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p class="text-[8px] font-bold text-white/50 uppercase tracking-widest">Potential</p>
                      <h5 class="text-lg font-bold">Safe</h5>
                    </div>
                  </div>
                </div>

                <button 
                  @click="handleGenerateReport"
                  :disabled="isGeneratingReport"
                  class="w-full bg-white text-primary py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Loader2 v-if="isGeneratingReport" class="w-4 h-4 animate-spin" />
                  {{ isGeneratingReport ? 'Processing...' : 'Generate Report' }}
                </button>
             </div>
           </section>
         </div>
      </div>

      <!-- VIEW: ORG REQUESTS -->
      <div v-if="currentView === 'org_requests'" class="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">Organization Requests</h2>
            <p class="text-sm text-gray-500 font-medium italic">Review and approve student membership applications.</p>
          </div>
          <div class="px-4 py-2 bg-primary/10 rounded-xl text-primary font-black text-xs uppercase tracking-widest">
            {{ store.orgApplications.length }} Pending
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div 
            v-for="app in store.orgApplications" 
            :key="app.id"
            class="bg-white p-6 rounded-[2.5rem] border border-gray-100 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:translate-x-1 transition-all"
          >
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary border border-gray-100 shadow-inner group-hover:scale-110 transition-transform">
                <Users class="w-7 h-7" />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-black text-gray-900">{{ app.student_name }}</h3>
                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ app.program }} {{ app.year }}</span>
                </div>
                <p class="text-xs text-gray-500 font-medium">Applied to join <span class="text-primary font-bold">{{ app.org_name }}</span></p>
                <p class="text-[9px] text-gray-300 font-bold uppercase tracking-tighter mt-1">{{ new Date(app.applied_at).toLocaleString() }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button 
                @click="handleRejectApp(app.id)"
                class="px-6 py-3 rounded-2xl bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-95"
              >
                Reject
              </button>
              <button 
                @click="handleApproveApp(app.id)"
                class="px-6 py-3 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-red-800 transition-all active:scale-95"
              >
                Approve Membership
              </button>
            </div>
          </div>

          <div v-if="store.orgApplications.length === 0" class="py-20 text-center space-y-4 opacity-30">
            <CheckCircle class="w-16 h-16 mx-auto" />
            <p class="text-xl font-bold">All caught up! No pending applications.</p>
          </div>
        </div>
      </div>

      <!-- VIEW: MESSAGES (CHAT) -->
      <div v-if="currentView === 'messages'" class="h-[600px] flex gap-6 animate-in fade-in slide-in-from-bottom-4">
        <!-- Conversation Sidebar -->
        <aside class="w-full sm:w-1/3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div class="p-6 border-b border-gray-50">
            <h3 class="font-bold text-gray-800 tracking-tight">Conversations</h3>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Student Inquiries</p>
          </div>
          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <div 
              v-for="conv in store.conversations" 
              :key="conv.id"
              @click="startChatPolling(conv.id)"
              :class="['p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-gray-50 border-b border-gray-50', selectedStudentId === conv.id ? 'bg-primary/5 border-l-4 border-l-primary' : '']"
            >
               <div class="relative">
                 <UserAvatar :name="conv.name" :avatar="conv.avatar" size="w-10 h-10" role="student" />
                 <span v-if="conv.unread_count > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {{ conv.unread_count }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline">
                  <p class="font-bold text-gray-800 text-sm truncate">{{ conv.name }}</p>
                  <span class="text-[8px] font-bold text-gray-400">{{ formatTime(conv.last_message_at) }}</span>
                </div>
                <p class="text-xs text-gray-400 truncate">{{ conv.last_message || 'No messages yet' }}</p>
              </div>
            </div>
            <div v-if="store.conversations.length === 0" class="p-8 text-center opacity-30">
              <MessageSquare :size="32" class="mx-auto mb-2" />
              <p class="text-[10px] font-bold uppercase tracking-widest">No conversations</p>
            </div>
          </div>
        </aside>

        <!-- Chat Window -->
        <main class="hidden sm:flex flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex-col">
          <template v-if="selectedStudentId">
            <!-- Chat Header -->
            <div class="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
               <div class="flex items-center gap-3">
                 <UserAvatar 
                   :name="store.conversations.find(c => c.id === selectedStudentId)?.name" 
                   :avatar="store.conversations.find(c => c.id === selectedStudentId)?.avatar" 
                   size="w-10 h-10" 
                   role="student" 
                 />
                 <div>
                  <p class="font-bold text-gray-800 text-sm">{{ store.conversations.find(c => c.id === selectedStudentId)?.name }}</p>
                  <p class="text-[9px] font-bold text-primary uppercase tracking-widest">{{ store.conversations.find(c => c.id === selectedStudentId)?.program }} • {{ selectedStudentId }}</p>
                </div>
              </div>
            </div>

            <!-- Chat Messages -->
            <div ref="chatScroll" class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
              <div 
                v-for="msg in store.chatMessages" 
                :key="msg.id"
                :class="['flex', msg.sender_id === store.user.id ? 'justify-end' : 'justify-start']"
              >
                <div :class="['max-w-[70%] p-4 rounded-2xl text-sm font-medium shadow-sm', msg.sender_id === store.user.id ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100']">
                  {{ msg.content }}
                  <div :class="['flex items-center gap-1.5 mt-1 px-2', msg.sender_id === store.user.id ? 'justify-end' : 'justify-start']">
                    <p :class="['text-[8px] uppercase font-bold tracking-widest', msg.sender_id === store.user.id ? 'text-white/60' : 'text-gray-400']">
                      {{ formatTime(msg.created_at) }}
                    </p>
                    <CheckCheck v-if="msg.sender_id === store.user.id" :class="['w-3 h-3', msg.is_read ? 'text-white' : 'text-white/30']" />
                  </div>
                </div>
              </div>
              <div v-if="store.chatMessages.length === 0" class="flex flex-col items-center justify-center h-full text-center p-8 opacity-20">
                <MessageSquare :size="48" class="mb-4" />
                <p class="text-xs font-bold uppercase tracking-widest">Start a conversation with this student.</p>
              </div>
            </div>

            <!-- Chat Input -->
            <div class="p-6 border-t border-gray-50 bg-white">
              <div class="relative">
                <input 
                  v-model="adminMessageInput"
                  @keyup.enter="handleSendAdminMessage"
                  type="text" 
                  placeholder="Type your response..."
                  class="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                >
                <button 
                  @click="handleSendAdminMessage"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Send :size="18" />
                </button>
              </div>
            </div>
          </template>
          <div v-else class="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
            <MessageSquare :size="64" class="mb-4" />
            <h4 class="text-xl font-bold italic tracking-tight">Select a conversation</h4>
            <p class="text-xs font-bold uppercase tracking-widest mt-2">Click on a student to see their message history.</p>
          </div>
        </main>
      </div>

      <!-- VIEW: SETTINGS -->
      <div v-if="currentView === 'settings'" class="max-w-2xl animate-in fade-in slide-in-from-bottom-4">
         <section class="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl text-center space-y-6">
            <div class="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto text-gray-400">
               <Settings :size="40" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-gray-900 tracking-tight">System Settings</h3>
              <p class="text-gray-500 font-medium max-w-sm mx-auto">Database-driven settings have been disabled for stability. Campus configurations are now managed via the server environment files.</p>
            </div>
            <div class="pt-6">
               <div class="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl text-amber-700 font-bold text-xs uppercase tracking-widest border border-amber-100">
                  <ShieldAlert :size="14" /> READ-ONLY MODE
               </div>
            </div>
         </section>
      </div>

      <!-- Modal -->
      <AdminStudentModal 
        v-if="isModalOpen" 
        :editing="editingStudent"
        :default-tab="initialTab"
        @close="isModalOpen = false; loadAllData()"
      />
    </div>
  </div>
</template>

<style scoped>
.text-secondary-dark { color: #8A6D00; }
.text-primary-light { color: #FF6B6B; }
</style>
