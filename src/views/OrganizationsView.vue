<script setup>
import { ref, computed } from 'vue';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowRight, 
  Code, 
  Palette, 
  Trophy, 
  Rocket, 
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  X
} from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';
import { onMounted } from 'vue';

const store = usePortalStore();
const searchQuery = ref('');
const activeFilter = ref('All');
const isCreateModalOpen = ref(false);
const isSubmitting = ref(false);

const newOrg = ref({
  name: '',
  description: '',
  type: 'Academic',
  icon: 'Rocket',
  color: 'text-amber-600'
});

const icons = [
  { id: 'Rocket', label: 'Rocket (SSC)', icon: Rocket },
  { id: 'Code', label: 'Tech', icon: Code },
  { id: 'Palette', label: 'Arts', icon: Palette },
  { id: 'Trophy', label: 'Sports', icon: Trophy },
  { id: 'MessageCircle', label: 'General', icon: MessageCircle }
];

const colors = [
  { id: 'text-amber-600', label: 'Amber' },
  { id: 'text-blue-600', label: 'Blue' },
  { id: 'text-purple-600', label: 'Purple' },
  { id: 'text-red-700', label: 'Red' },
  { id: 'text-green-600', label: 'Green' }
];

const filters = ['All', 'Academic', 'Arts', 'Sports', 'Tech'];

const filteredOrgs = computed(() => {
  return store.organizations.filter(org => {
    const name = org.name || '';
    const desc = org.description || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         desc.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesFilter = activeFilter.value === 'All' || org.type === activeFilter.value;
    return matchesSearch && matchesFilter;
  });
});

const getIcon = (iconName) => {
  switch (iconName) {
    case 'Code': return Code;
    case 'Palette': return Palette;
    case 'Trophy': return Trophy;
    case 'Rocket': return Rocket;
    default: return MessageCircle;
  }
};

const applyingId = ref(null);

const handleJoin = async (org) => {
  if (org.membership_status) return; // Already a member or pending
  applyingId.value = org.id;
  await store.applyForOrganization(org.id);
  applyingId.value = null;
};

const handleCreateOrg = async () => {
  if (!newOrg.value.name) return;
  isSubmitting.value = true;
  await store.createOrganization(newOrg.value);
  isSubmitting.value = false;
  isCreateModalOpen.value = false;
  newOrg.value = { name: '', description: '', type: 'Academic', icon: 'Rocket', color: 'text-amber-600' };
};

const handleDeleteOrg = async (id) => {
  if (confirm('Are you sure you want to delete this organization? This will remove all member records.')) {
    await store.deleteOrganization(id);
  }
};

const getPendingForOrg = (orgId) => {
  return store.orgApplications.filter(app => app.org_id === orgId);
};

const handleApprove = async (appId) => {
  await store.updateOrgApplicationStatus(appId, 'active');
};

const handleReject = async (appId) => {
  await store.updateOrgApplicationStatus(appId, 'rejected');
};

onMounted(() => {
  store.fetchOrganizations();
  if (store.isAdmin) {
    store.fetchOrgApplications();
  }
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-5">
        <div class="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3">
          <Users class="w-7 h-7" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Student Organizations</h1>
          <p class="text-gray-500 font-medium">Join a community. Build your legacy.</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <button 
          v-if="store.isAdmin"
          @click="isCreateModalOpen = true"
          class="flex items-center gap-2 bg-primary hover:bg-red-800 text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-primary/20 active:scale-95 whitespace-nowrap"
        >
          <Plus class="w-4 h-4" /> Create Org
        </button>

        <div class="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 card-shadow overflow-x-auto scrollbar-hide">
          <button 
            v-for="filter in filters" 
            :key="filter"
            @click="activeFilter = filter"
            :class="['px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap', activeFilter === filter ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-primary hover:bg-primary/5']"
          >
            {{ filter }}
          </button>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="relative max-w-2xl">
      <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
        <Search class="w-5 h-5" />
      </span>
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Find an organization, club, or community..." 
        class="w-full bg-white border-2 border-transparent py-4 pl-12 pr-6 rounded-[2rem] text-sm font-bold text-gray-700 shadow-xl focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
      />
    </div>

    <!-- Organizations Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <article 
        v-for="org in filteredOrgs" 
        :key="org.id"
        class="group bg-white p-8 rounded-[2.5rem] border border-gray-100 card-shadow hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 flex flex-col relative overflow-hidden"
      >
        <!-- Background Pattern -->
        <div class="absolute -right-4 -top-4 w-32 h-32 bg-gray-50 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors"></div>

        <div class="relative z-10">
          <div :class="['w-16 h-16 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-gray-50', org.color, 'bg-gray-50/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500']">
            <component :is="getIcon(org.icon)" class="w-8 h-8" />
          </div>
          
          <h3 class="text-xl font-black text-gray-900 mb-2 group-hover:text-primary transition-colors flex items-center justify-between">
            {{ org.name }}
            <div class="flex items-center gap-2">
              <button 
                v-if="store.isAdmin"
                @click.stop="handleDeleteOrg(org.id)"
                class="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 class="w-4 h-4" />
              </button>
              <ArrowRight class="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </h3>
          <p class="text-sm text-gray-500 leading-relaxed font-bold mb-8">
            {{ org.description }}
          </p>
          
          <div class="flex items-center gap-6 mt-auto">
            <div class="flex items-center gap-2">
              <Users class="w-4 h-4 text-gray-400" />
              <span class="text-xs font-bold text-gray-700">{{ org.members }} Members</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span class="text-xs font-bold text-green-600">Active Now</span>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between relative z-10">
          <div class="flex -space-x-3">
             <div v-for="i in 3" :key="i" class="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                <img :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=OrgMember${org.id}${i}`" class="w-full h-full rounded-full" />
             </div>
             <div class="w-8 h-8 rounded-full border-2 border-white bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white">+{{ org.members - 3 }}</div>
          </div>
          <button 
            v-if="!store.isAdmin"
            @click="handleJoin(org)"
            :disabled="org.membership_status || applyingId === org.id"
            :class="[
              'px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2',
              org.membership_status === 'active' ? 'bg-green-100 text-green-600' :
              org.membership_status === 'pending' ? 'bg-amber-100 text-amber-600' :
              org.membership_status === 'rejected' ? 'bg-red-50 text-red-400' :
              'bg-gray-50 text-gray-900 hover:bg-primary hover:text-white'
            ]"
          >
            <Loader2 v-if="applyingId === org.id" class="w-3 h-3 animate-spin" />
            <CheckCircle2 v-else-if="org.membership_status === 'active'" class="w-3 h-3" />
            {{ 
              applyingId === org.id ? 'Applying...' : 
              org.membership_status === 'active' ? 'Member' : 
              org.membership_status === 'pending' ? 'Pending' : 
              org.membership_status === 'rejected' ? 'Rejected' : 
              'Join Club' 
            }}
          </button>
          
          <!-- Admin View: Pending Applications Summary -->
          <div v-if="store.isAdmin && getPendingForOrg(org.id).length > 0" class="flex flex-col gap-2 w-full">
            <p class="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">{{ getPendingForOrg(org.id).length }} New Applications</p>
            <div class="space-y-2">
              <div v-for="app in getPendingForOrg(org.id).slice(0, 2)" :key="app.id" class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div class="truncate mr-2">
                  <p class="text-[10px] font-bold text-gray-800 truncate">{{ app.student_name }}</p>
                  <p class="text-[8px] text-gray-400 uppercase font-black">{{ app.program }}</p>
                </div>
                <div class="flex gap-1">
                  <button @click="handleReject(app.id)" class="p-1 text-gray-400 hover:text-red-500 transition-colors"><X class="w-3 h-3" /></button>
                  <button @click="handleApprove(app.id)" class="p-1 text-green-500 hover:text-green-600 transition-colors"><CheckCircle2 class="w-3 h-3" /></button>
                </div>
              </div>
              <p v-if="getPendingForOrg(org.id).length > 2" class="text-[8px] text-center text-gray-400 font-bold italic">+ {{ getPendingForOrg(org.id).length - 2 }} more</p>
            </div>
          </div>
          <div v-else-if="store.isAdmin" class="text-[9px] font-bold text-gray-300 italic">No pending requests</div>
        </div>
      </article>

      <!-- Empty State -->
      <div v-if="filteredOrgs.length === 0" class="md:col-span-2 xl:col-span-3 py-20 text-center space-y-6">
        <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
           <Search class="w-10 h-10" />
        </div>
        <div>
           <h3 class="text-xl font-bold text-gray-900">No organizations found</h3>
           <p class="text-gray-500 mt-1">Try adjusting your search query or filters.</p>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <footer class="bg-slate-900 text-white rounded-[3rem] p-10 sm:p-16 flex flex-col sm:flex-row items-center justify-between gap-10 overflow-hidden relative shadow-2xl">
       <!-- Decoration -->
       <div class="absolute right-0 top-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
       
       <div class="relative z-10 text-center sm:text-left space-y-4">
          <h2 class="text-4xl font-black tracking-tighter max-w-md">Can't find what you're looking for?</h2>
          <p class="text-slate-400 font-bold max-w-sm">Start your own organization and get officially recognized by the CHCCI Student Council.</p>
       </div>
       
       <button class="relative z-10 bg-white text-slate-900 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:bg-primary hover:text-white transition-all group active:scale-95">
          Propose an Org
          <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-all" />
       </button>
    </footer>
  </div>
  <!-- Create Org Modal -->
  <div v-if="isCreateModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
    <div class="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div class="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 class="font-black text-gray-900 uppercase tracking-widest text-sm">Create Organization</h3>
          <p class="text-[10px] text-gray-400 font-bold uppercase mt-1">Official Resource Registry</p>
        </div>
        <button @click="isCreateModalOpen = false" class="p-3 text-gray-400 hover:bg-white rounded-2xl transition-all shadow-sm">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <div class="p-8 space-y-6">
        <div class="space-y-1.5">
          <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Org Name</label>
          <input v-model="newOrg.name" type="text" placeholder="e.g. Student Supreme Council" class="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
            <select v-model="newOrg.type" class="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all appearance-none">
              <option v-for="cat in filters.filter(f => f !== 'All')" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pick Icon</label>
            <select v-model="newOrg.icon" class="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all appearance-none">
              <option v-for="ic in icons" :key="ic.id" :value="ic.id">{{ ic.label }}</option>
            </select>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
          <textarea v-model="newOrg.description" rows="3" placeholder="Mission and vision..." class="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all"></textarea>
        </div>

        <button 
          @click="handleCreateOrg"
          :disabled="!newOrg.name || isSubmitting"
          class="w-full bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:bg-red-800 transition-all disabled:opacity-50 mt-4 active:scale-95"
        >
          {{ isSubmitting ? 'Registering...' : 'Register Official Organization' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
