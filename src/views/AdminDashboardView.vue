<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { useRouter, useRoute } from 'vue-router';
import { 
  Users, UserPlus, Search, Edit2, Trash2, LogOut, LayoutDashboard, 
  BarChart3, Settings, Bell, Wallet, TrendingUp, ShieldAlert, Save, 
  CheckCircle2, Building2, Megaphone, BookOpen, Loader2
} from 'lucide-vue-next';
import AdminStudentModal from '../components/AdminStudentModal.vue';

const store = usePortalStore();
const router = useRouter();
const route = useRoute();
const currentView = ref(route.query.view || 'dashboard'); // 'dashboard', 'students', 'analytics', 'settings'
const searchQuery = ref('');
const isModalOpen = ref(false);
const editingStudent = ref(null);
const initialTab = ref('info');
const stats = ref({ totalStudents: 0, totalBalance: 0, programDistribution: [] });
const settings = ref({ campusName: '', maintenanceMode: false, announcement: '' });
const isSavingSettings = ref(false);
const isNotificationOpen = ref(false);
const isGeneratingReport = ref(false);

const notifications = ref([
  { id: 1, title: 'New Enrollment', message: 'John Doe has completed registration.', time: '2 mins ago', unread: true },
  { id: 2, title: 'System Alert', message: 'Database backup completed successfully.', time: '1 hour ago', unread: false },
]);

onMounted(async () => {
  await loadAllData();
});

const setView = (v) => {
  console.log('Navigating to:', v);
  currentView.value = v;
  isNotificationOpen.value = false;
  router.push({ query: { ...route.query, view: v } });
};

// Sync view with URL query changes (e.g. from Sidebar)
watch(() => route.query.view, (newView) => {
  if (newView && ['dashboard', 'students', 'analytics', 'settings'].includes(newView)) {
    currentView.value = newView;
  } else if (!newView) {
    currentView.value = 'dashboard';
  }
});

const markAllRead = () => {
  notifications.value.forEach(n => n.unread = true); // Set to true if you want them read
  isNotificationOpen.value = false;
};

const handleGenerateReport = () => {
  isGeneratingReport.value = true;
  setTimeout(() => {
    isGeneratingReport.value = false;
    alert('Report Generated Successfully');
  }, 2000);
};

const loadAllData = async () => {
  try {
    await store.fetchStudents();
    const statsData = await store.fetchAdminStats();
    if (statsData) stats.value = statsData;
    const settingsData = await store.fetchSettings();
    if (settingsData) settings.value = settingsData;
  } catch (err) {
    console.error('Data Load Error', err);
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
  if (confirm('Are you sure you want to delete this student?')) {
    await store.deleteStudent(id);
    await loadAllData();
  }
};

const handleSignOut = () => {
  store.signOut();
  router.push({ name: 'home' });
};

const handleSaveSettings = async () => {
  isSavingSettings.value = true;
  await store.updateSettings(settings.value);
  isSavingSettings.value = false;
  alert('System settings updated successfully!');
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
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
    <!-- Header Section -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight capitalize">
          Admin <span class="text-primary italic">{{ currentView }}</span>
        </h1>
        <p class="text-gray-500 mt-1 flex items-center gap-2">
          <Building2 class="w-4 h-4 text-primary" />
          {{ settings.campusName }} Central Administration
        </p>
      </div>
      
      <!-- Quick Actions / View Switcher (Old School Tabs) -->
      <div class="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <button 
          v-for="v in ['dashboard', 'students', 'analytics', 'settings']" 
          :key="v"
          @click="setView(v)"
          :class="['px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap', currentView === v ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-primary']"
        >
          {{ v }}
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
          <h3 class="text-3xl font-black text-gray-900 mt-1">{{ stats.totalStudents }}</h3>
          <div class="mt-3 flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-lg uppercase"><TrendingUp :size="12" /> +12% Growth</div>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          <div class="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm"><Wallet :size="24" /></div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outstanding Balance</p>
          <h3 class="text-3xl font-black text-gray-900 mt-1">₱{{ (stats.totalBalance || 0).toLocaleString() }}</h3>
          <div class="mt-3 flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/5 w-fit px-2 py-1 rounded-lg uppercase"><CheckCircle2 :size="12" /> Stable Collection</div>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
          <div class="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm"><ShieldAlert :size="24" /></div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Critical Average</p>
          <h3 class="text-3xl font-black text-gray-900 mt-1">3.2</h3>
          <div class="mt-3 flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 w-fit px-2 py-1 rounded-lg uppercase"><TrendingUp :size="12" /> Alert</div>
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
              <div v-for="s in store.students.slice(0, 4)" :key="s.id" class="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-50 group hover:bg-white hover:border-primary/20 transition-all">
                <div class="flex items-center gap-3">
                  <img :src="s.avatar" class="w-10 h-10 rounded-xl" alt="">
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
                    <img :src="student.avatar" class="w-10 h-10 rounded-xl shadow-sm" alt="">
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

    <!-- VIEW: SETTINGS -->
    <div v-if="currentView === 'settings'" class="max-w-2xl">
       <section class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
          <div>
            <h3 class="text-xl font-bold text-gray-800 tracking-tight mb-2">System Configuration</h3>
            <p class="text-sm text-gray-500 font-medium">Manage campus portal settings.</p>
          </div>

          <div class="space-y-6">
             <div class="space-y-2">
               <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Campus Name</label>
               <input v-model="settings.campusName" type="text" class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-primary outline-none transition-all font-bold text-gray-700 text-sm">
             </div>

             <div class="space-y-2">
               <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Portal Announcement</label>
               <textarea v-model="settings.announcement" rows="4" class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-primary outline-none transition-all font-bold text-gray-700 text-sm custom-scrollbar"></textarea>
             </div>

             <div class="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
               <div class="flex items-center gap-3">
                  <div :class="['w-10 h-10 rounded-xl flex items-center justify-center text-white', settings.maintenanceMode ? 'bg-primary' : 'bg-green-500']">
                     <ShieldAlert :size="20" />
                  </div>
                  <div>
                    <p class="font-bold text-gray-800 text-sm">Maintenance Mode</p>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">Blocks student access</p>
                  </div>
               </div>
               <button 
                @click="settings.maintenanceMode = !settings.maintenanceMode"
                :class="['w-12 h-6 rounded-full relative transition-all p-1', settings.maintenanceMode ? 'bg-primary' : 'bg-gray-200']"
               >
                  <div :class="['w-4 h-4 bg-white rounded-full transition-all shadow-sm', settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0']"></div>
               </button>
             </div>
          </div>

          <div class="pt-4">
            <button 
              @click="handleSaveSettings"
              :disabled="isSavingSettings"
              class="w-full bg-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:bg-red-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save v-if="!isSavingSettings" :size="18" />
              <Loader2 v-else class="w-4 h-4 animate-spin" />
              Save Configurations
            </button>
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
</template>

<style scoped>
.text-secondary-dark { color: #8A6D00; }
.text-primary-light { color: #FF6B6B; }
</style>
