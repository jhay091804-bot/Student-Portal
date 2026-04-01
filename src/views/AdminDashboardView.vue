<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { useRouter } from 'vue-router';
import { 
  Users, UserPlus, Search, Edit2, Trash2, LogOut, LayoutDashboard, 
  BarChart3, Settings, Bell, Wallet, TrendingUp, ShieldAlert, Save, 
  CheckCircle2, Building2, Megaphone
} from 'lucide-vue-next';
import AdminStudentModal from '../components/AdminStudentModal.vue';

const store = usePortalStore();
const router = useRouter();
const currentView = ref('dashboard'); // 'dashboard', 'students', 'analytics', 'settings'
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
};

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
  <div class="min-h-screen bg-slate-50 flex font-sans">
    <!-- Sidebar -->
    <aside class="w-72 bg-slate-900 text-white flex flex-col p-8 fixed h-full shadow-2xl z-50">
      <div class="flex items-center gap-4 mb-12">
        <div class="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/20 italic cursor-pointer" @click="setView('dashboard')">C</div>
        <div>
          <span class="font-black text-xl tracking-tighter block leading-none">CHCCI</span>
          <span class="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Admin Portal</span>
        </div>
      </div>

      <nav class="flex-1 space-y-3 relative z-10">
        <button 
          type="button"
          @click="setView('dashboard')"
          :class="['w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all cursor-pointer', currentView === 'dashboard' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5']"
        >
          <LayoutDashboard :size="22" /> Dashboard
        </button>
        <button 
          type="button"
          @click="setView('students')"
          :class="['w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all cursor-pointer', currentView === 'students' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5']"
        >
          <Users :size="22" /> Students
        </button>
        <button 
          type="button"
          @click="setView('analytics')"
          :class="['w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all cursor-pointer', currentView === 'analytics' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5']"
        >
          <BarChart3 :size="22" /> Analytics
        </button>
        <button 
          type="button"
          @click="setView('settings')"
          :class="['w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all cursor-pointer', currentView === 'settings' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5']"
        >
          <Settings :size="22" /> Settings
        </button>
      </nav>

      <div class="mt-auto space-y-6">
        <div class="p-5 bg-white/5 rounded-3xl border border-white/10">
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">System Status</p>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-300">Server</span>
            <span class="flex items-center gap-1.5 text-[10px] font-black text-green-500 uppercase"><div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Online</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-300">Database</span>
            <span class="flex items-center gap-1.5 text-[10px] font-black text-green-500 uppercase"><div class="w-1.5 h-1.5 rounded-full bg-green-500"></div> Connected</span>
          </div>
        </div>
        <button @click="handleSignOut" class="w-full flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-red-400 font-bold transition-all">
          <LogOut :size="22" /> Sign Out
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="ml-72 flex-1 p-10 min-h-screen relative">
      <!-- FIXED HEADER -->
      <header class="flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 class="text-4xl font-black text-slate-800 tracking-tighter capitalize">{{ currentView }}</h1>
          <p class="text-slate-500 mt-1 font-medium">{{ settings.campusName }} Central Administration</p>
        </div>
        
        <div class="flex items-center gap-6">
          <div class="flex gap-2 relative">
             <button @click="isNotificationOpen = !isNotificationOpen" class="p-3 text-slate-400 hover:text-slate-600 bg-white rounded-2xl shadow-sm border border-slate-100 relative group transition-all">
              <Bell :size="22" />
              <span v-if="notifications.some(n => n.unread)" class="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
            </button>

            <!-- Notifications Dropdown -->
            <div v-if="isNotificationOpen" class="absolute top-16 right-0 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 p-6 animate-in zoom-in-95 duration-200">
               <div class="flex items-center justify-between mb-4 px-2">
                 <h4 class="font-black text-slate-800 tracking-tight">Activity Alerts</h4>
                 <button @click="markAllRead" class="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">Mark All Read</button>
               </div>
               <div class="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  <div v-for="n in notifications" :key="n.id" :class="['p-4 rounded-2xl border-2 transition-all', n.unread ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-50']">
                    <p class="text-xs font-black text-slate-800 leading-tight mb-1">{{ n.title }}</p>
                    <p class="text-[11px] text-slate-500 leading-normal mb-2">{{ n.message }}</p>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ n.time }}</span>
                  </div>
               </div>
            </div>

            <button @click="setView('settings')" class="p-3 text-slate-400 hover:text-slate-600 bg-white rounded-2xl shadow-sm border border-slate-100 group transition-all">
              <Settings :size="22" />
            </button>
          </div>
          <div class="flex items-center gap-4 pl-6 border-l-2 border-slate-200">
            <div class="text-right">
              <p class="text-sm font-black text-slate-800 leading-none mb-1">{{ store.user?.name }}</p>
              <p class="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">Super Administrator</p>
            </div>
            <div class="relative">
              <div class="absolute inset-0 bg-amber-500/10 rounded-2xl blur-lg"></div>
              <img :src="store.user?.avatar" class="w-12 h-12 rounded-2xl shadow-md border-2 border-white relative z-10" alt="Admin">
            </div>
          </div>
        </div>
      </header>

      <!-- VIEW: DASHBOARD -->
      <div v-if="currentView === 'dashboard'" class="space-y-10">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div class="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div class="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Users :size="28" /></div>
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Enrolled Students</p>
            <h3 class="text-5xl font-black text-slate-800 mt-2">{{ stats.totalStudents }}</h3>
            <div class="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-500 bg-green-50 w-fit px-2 py-1 rounded-lg uppercase tracking-wider"><TrendingUp :size="12" /> +12% Growth</div>
          </div>

          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div class="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
            <div class="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Wallet :size="28" /></div>
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Outstanding Balance</p>
            <h3 class="text-5xl font-black text-slate-800 mt-2">₱{{ (stats.totalBalance || 0).toLocaleString() }}</h3>
            <div class="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-500 bg-amber-50 w-fit px-2 py-1 rounded-lg uppercase tracking-wider"><CheckCircle2 :size="12" /> Stable Collection</div>
          </div>

          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div class="absolute -right-6 -top-6 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
            <div class="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><ShieldAlert :size="28" /></div>
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Critical Average</p>
            <h3 class="text-5xl font-black text-slate-800 mt-2">3.2</h3>
            <div class="mt-4 flex items-center gap-2 text-[10px] font-bold text-red-500 bg-red-50 w-fit px-2 py-1 rounded-lg uppercase tracking-wider"><TrendingUp :size="12" /> Requires Attention</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <!-- Recent Activity (Simplified) -->
           <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
             <div class="flex items-center justify-between mb-8">
               <h3 class="text-2xl font-black text-slate-800 tracking-tight">Recent Enrollments</h3>
               <button @click="currentView = 'students'" class="text-sm font-bold text-amber-500 hover:underline">View All</button>
             </div>
             <div class="space-y-6">
                <div v-for="s in store.students.slice(0, 4)" :key="s.id" class="flex items-center justify-between p-4 bg-slate-50/50 rounded-3xl border border-slate-50 group hover:bg-white hover:border-amber-100 transition-all">
                  <div class="flex items-center gap-4">
                    <img :src="s.avatar" class="w-12 h-12 rounded-2xl" alt="">
                    <div>
                      <p class="font-black text-slate-800 leading-none mb-1 group-hover:text-amber-500 transition-colors">{{ s.name }}</p>
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ s.program }} • {{ s.id }}</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-black bg-white px-3 py-1.5 rounded-xl border border-slate-100 text-slate-400 uppercase group-hover:border-amber-200">Just Now</span>
                </div>
             </div>
           </div>

           <!-- Program Snapshot -->
           <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
              <h3 class="text-2xl font-black text-slate-800 tracking-tight mb-8">Program Popularity</h3>
              <div class="space-y-8">
                <div v-for="prog in stats.programDistribution" :key="prog.program" class="space-y-2">
                   <div class="flex justify-between items-end">
                      <span class="text-sm font-black text-slate-700 tracking-tight">{{ prog.program }}</span>
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ prog.count }} Students</span>
                   </div>
                   <div class="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div class="h-full bg-amber-500 rounded-full transition-all duration-1000 origin-left" :style="{ width: getProgramPercentage(prog.count) + '%' }"></div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>

      <!-- VIEW: STUDENTS (TABLE VIEW) -->
      <div v-if="currentView === 'students'" class="space-y-8">
        <div class="flex justify-between items-center mb-10">
          <div class="relative w-full max-w-lg">
            <Search class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" :size="24" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by student name, ID number, or program..."
              class="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:border-amber-500 outline-none transition-all shadow-sm font-bold text-slate-700"
            >
          </div>
          <button @click="handleAddStudent" class="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-slate-900/20">
            <UserPlus :size="20" /> Enroll Student
          </button>
        </div>

        <div class="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th class="px-10 py-6">Student Information</th>
                <th class="px-6 py-6">Course / Year</th>
                <th class="px-6 py-6 font-center">Account Balance</th>
                <th class="px-6 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-slate-50/80 transition-all group">
                <td class="px-10 py-8">
                  <div class="flex items-center gap-5">
                    <img :src="student.avatar" class="w-16 h-16 rounded-3xl shadow-lg group-hover:scale-105 transition-transform" alt="">
                    <div>
                      <div class="font-black text-slate-800 text-lg group-hover:text-amber-500 transition-colors">{{ student.name }}</div>
                      <div class="text-xs font-bold text-slate-400 font-mono tracking-widest mt-1">{{ student.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-8">
                  <div class="space-y-1">
                    <div class="text-sm font-black text-slate-700">{{ student.program }}</div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ student.year }}</div>
                  </div>
                </td>
                <td class="px-6 py-8">
                   <div class="text-lg font-black" :class="student.balance > 0 ? 'text-slate-800' : 'text-green-500'">
                     ₱{{ (student.balance || 0).toLocaleString() }}
                   </div>
                   <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</div>
                </td>
                <td class="px-10 py-8 text-right whitespace-nowrap">
                  <div class="flex justify-end gap-2">
                    <button @click="handleEdit(student, 'subjects')" class="group flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm font-black uppercase text-[9px] tracking-widest">
                      <BookOpen :size="16" />
                      <span>Subjects</span>
                    </button>
                    <button @click="handleEdit(student, 'info')" class="group flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm font-black uppercase text-[9px] tracking-widest">
                      <Edit2 :size="16" />
                      <span>Edit</span>
                    </button>
                    <button @click="handleDelete(student.id)" class="group flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm font-black uppercase text-[9px] tracking-widest">
                      <Trash2 :size="16" />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredStudents.length === 0" class="py-24 text-center">
             <div class="max-w-xs mx-auto space-y-4">
                <div class="w-20 h-20 bg-slate-50 rounded-full mx-auto flex items-center justify-center border-2 border-dashed border-slate-200">
                  <Search :size="32" class="text-slate-300" />
                </div>
                <h4 class="font-black text-slate-800">No Students Found</h4>
                <p class="text-sm text-slate-400">We couldn't find any student matching "{{ searchQuery }}". Try another search term.</p>
             </div>
          </div>
        </div>
      </div>

      <!-- VIEW: ANALYTICS -->
      <div v-if="currentView === 'analytics'" class="space-y-10">
         <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <!-- Enrollment Distribution Chart -->
           <div class="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
             <div class="relative z-10">
               <h3 class="text-2xl font-black text-slate-800 tracking-tight mb-4">Enrollment Distribution</h3>
               <p class="text-sm text-slate-500 mb-12">Breakdown of students based on their registered academic program.</p>
               
               <div class="flex items-end justify-between gap-6 h-64 px-4">
                 <div v-for="prog in stats.programDistribution" :key="prog.program" class="flex-1 flex flex-col items-center justify-end group gap-4 h-full">
                    <div class="w-full bg-amber-500/5 rounded-t-3xl border border-dashed border-amber-200 flex flex-col justify-end p-1 min-h-[10%]" :style="{ height: getProgramPercentage(prog.count) + '%' }">
                      <div class="w-full bg-amber-500 rounded-t-2xl h-full shadow-lg transition-all translate-y-1 group-hover:translate-y-0 group-hover:brightness-110"></div>
                    </div>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest rotate-45 mt-4 min-h-[40px]">{{ prog.program }}</span>
                 </div>
               </div>
             </div>
           </div>

           <!-- Financial Insights -->
           <div class="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
             <div class="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent"></div>
             <div class="relative z-10 space-y-10">
                <div>
                  <h3 class="text-2xl font-black tracking-tight mb-2">Financial Insights</h3>
                  <p class="text-sm text-slate-400">Current financial health and outstanding collectibles.</p>
                </div>

                <div class="space-y-8">
                  <div class="flex items-center gap-6">
                    <div class="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center text-amber-500 border border-white/10"><Wallet :size="32" /></div>
                    <div>
                      <p class="text-xs font-black text-slate-500 uppercase tracking-widest">Total Outstanding</p>
                      <h4 class="text-4xl font-black tracking-tighter italic">₱{{ (stats.totalBalance || 0).toLocaleString() }}</h4>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Avg per Student</p>
                      <h5 class="text-xl font-bold mt-1">₱{{ Math.round((stats.totalBalance || 0) / (stats.totalStudents || 1)).toLocaleString() }}</h5>
                    </div>
                    <div class="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Potential</p>
                      <h5 class="text-xl font-bold mt-1">₱{{ (stats.totalStudents * 15000).toLocaleString() }}</h5>
                    </div>
                  </div>
                </div>

                <button 
                  @click="handleGenerateReport"
                  :disabled="isGeneratingReport"
                  class="w-full bg-amber-500 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  <div v-if="isGeneratingReport" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {{ isGeneratingReport ? 'Processing Data...' : 'Generate Financial Report' }}
                </button>
             </div>
           </div>
         </div>
      </div>

      <!-- VIEW: SETTINGS -->
      <div v-if="currentView === 'settings'" class="max-w-2xl">
         <div class="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-10">
            <div>
              <h3 class="text-2xl font-black text-slate-800 tracking-tight mb-2">System Configuration</h3>
              <p class="text-sm text-slate-500">Manage campus-wide portal settings and communications.</p>
            </div>

            <div class="space-y-8">
               <div class="space-y-3">
                 <label class="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Campus Name</label>
                 <div class="relative group">
                    <Building2 class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" :size="20" />
                    <input v-model="settings.campusName" type="text" class="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-amber-500 outline-none transition-all font-bold text-slate-700">
                 </div>
               </div>

               <div class="space-y-3">
                 <label class="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Portal Announcement</label>
                 <div class="relative group">
                    <Megaphone class="absolute left-4 top-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" :size="20" />
                    <textarea v-model="settings.announcement" rows="4" class="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-amber-500 outline-none transition-all font-bold text-slate-700 custom-scrollbar"></textarea>
                 </div>
               </div>

               <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                 <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center" :class="settings.maintenanceMode ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'">
                       <ShieldAlert :size="24" />
                    </div>
                    <div>
                      <p class="font-black text-slate-800 leading-none mb-1">Maintenance Mode</p>
                      <p class="text-[10px] font-bold text-slate-400 uppercase">Blocks student portal access</p>
                    </div>
                 </div>
                 <button 
                  @click="settings.maintenanceMode = !settings.maintenanceMode"
                  :class="['w-16 h-8 rounded-full relative transition-all p-1', settings.maintenanceMode ? 'bg-amber-500' : 'bg-slate-200']"
                 >
                    <div :class="['w-6 h-6 bg-white rounded-full transition-all shadow-sm', settings.maintenanceMode ? 'translate-x-8' : 'translate-x-0']"></div>
                 </button>
               </div>
            </div>

            <div class="pt-6">
              <button 
                @click="handleSaveSettings"
                :disabled="isSavingSettings"
                class="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Save v-if="!isSavingSettings" :size="20" />
                <div v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Save Configurations
              </button>
            </div>
         </div>
      </div>
    </main>

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
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
