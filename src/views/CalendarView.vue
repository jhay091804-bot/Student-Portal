<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  Search,
  Filter,
  List as ListIcon,
  LayoutGrid,
  X
} from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';

const store = usePortalStore();
const currentDate = ref(new Date());
const viewMode = ref('calendar'); // 'calendar' or 'list'
const isModalOpen = ref(false);
const isSubmitting = ref(false);

const newEvent = ref({
  title: '',
  date: new Date().toISOString().split('T')[0],
  type: 'academic',
  color: 'bg-red-500',
  description: ''
});

const eventTypes = [
  { id: 'academic', label: 'Academic', color: 'bg-red-500' },
  { id: 'event', label: 'Event', color: 'bg-yellow-500' },
  { id: 'sports', label: 'Sports', color: 'bg-blue-500' },
  { id: 'holiday', label: 'Holiday', color: 'bg-gray-500' }
];

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const date = new Date(year, month, 1);
  const days = [];
  
  // Fill initial empty days
  const firstDayIndex = date.getDay();
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  
  // Fill dates of month
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return days;
});

const monthYear = computed(() => {
  return currentDate.value.toLocaleString('default', { month: 'long', year: 'numeric' });
});

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

const getEventsForDate = (date) => {
  if (!date) return [];
  // Adjust for timezone to get pure local date string
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return store.events.filter(e => e.date === dateStr);
};

const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
};

const handleAddEvent = async () => {
  if (!newEvent.value.title || !newEvent.value.date) return;
  isSubmitting.value = true;
  await store.createCalendarEvent(newEvent.value);
  isSubmitting.value = false;
  isModalOpen.value = false;
  newEvent.value = { title: '', date: new Date().toISOString().split('T')[0], type: 'academic', color: 'bg-red-500', description: '' };
};

const handleDeleteEvent = async (id) => {
  if (confirm('Are you sure you want to delete this event?')) {
    await store.deleteCalendarEvent(id);
  }
};

onMounted(() => {
  store.fetchCalendarEvents();
  // Polling for real-time updates
  setInterval(() => store.fetchCalendarEvents(), 10000);
});
</script>

<template>
  <div class="calendar-page-container">
    <div class="p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20 text-white">
            <CalendarIcon class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Campus Events</h1>
            <p class="text-sm text-gray-500">Stay updated with CHCCI academic and social activities.</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button 
            v-if="store.isAdmin"
            @click="isModalOpen = true"
            class="flex items-center gap-2 bg-primary hover:bg-red-800 text-white px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus class="w-4 h-4" /> Add Event
          </button>

          <div class="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            <button 
              @click="viewMode = 'calendar'"
              :class="['p-2 rounded-xl transition-all', viewMode === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600']"
            >
              <LayoutGrid class="w-5 h-5" />
            </button>
            <button 
              @click="viewMode = 'list'"
              :class="['p-2 rounded-xl transition-all', viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600']"
            >
              <ListIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Calendar Controls -->
      <div v-if="viewMode === 'calendar'" class="bg-white p-6 rounded-3xl border border-gray-100 card-shadow">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-xl font-black text-gray-900 tracking-tight">{{ monthYear }}</h2>
          <div class="flex items-center gap-2">
            <button @click="prevMonth" class="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
              <ChevronLeft class="w-5 h-5" />
            </button>
            <button @click="currentDate = new Date()" class="px-4 py-2 text-xs font-bold text-gray-400 hover:text-primary transition-colors">TODAY</button>
            <button @click="nextMonth" class="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
          <!-- Weekdays -->
          <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" class="bg-gray-50/80 p-4 text-center">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{{ day }}</span>
          </div>
          
          <!-- Days -->
          <div 
            v-for="(date, idx) in daysInMonth" 
            :key="idx"
            :class="['bg-white min-h-[120px] p-2 transition-all relative group', date ? 'hover:bg-gray-50/50' : 'bg-gray-50/30']"
          >
            <div v-if="date" class="flex flex-col h-full">
              <span :class="['text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full mb-2 transition-colors', isToday(date) ? 'bg-primary text-white shadow-md' : 'text-gray-500 group-hover:text-primary']">
                {{ date.getDate() }}
              </span>
              
              <!-- Events for this day -->
              <div class="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar pr-1">
                <div 
                  v-for="event in getEventsForDate(date)" 
                  :key="event.id"
                  :class="['text-[9px] font-bold p-1 rounded-md truncate border-l-2 shadow-sm relative group/event', event.color, 'bg-opacity-10 border-current opacity-90']"
                  :title="event.title"
                >
                  {{ event.title }}
                  <button 
                    v-if="store.isAdmin" 
                    @click.stop="handleDeleteEvent(event.id)"
                    class="absolute right-0 top-0 bottom-0 px-1 bg-red-500 text-white opacity-0 group-hover/event:opacity-100 transition-opacity rounded-r-md"
                  >
                    <X :size="8" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="space-y-4">
        <div 
          v-for="event in store.events" 
          :key="event.id"
          class="bg-white p-5 rounded-3xl border border-gray-100 card-shadow flex items-start gap-6 group hover:translate-x-1 transition-all"
        >
          <div :class="['p-4 rounded-2xl shrink-0 shadow-sm', event.color, 'bg-opacity-20 text-current']">
            <CalendarIcon class="w-6 h-6" />
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{{ event.title }}</h3>
              <span class="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{ event.type }}</span>
            </div>
            <div class="mt-4 flex flex-wrap gap-6">
              <div class="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <CalendarIcon class="w-4 h-4 text-primary" />
                {{ new Date(event.date).toLocaleDateString('default', { dateStyle: 'long' }) }}
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <Clock class="w-4 h-4 text-primary" />
                All Day
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <MapPin class="w-4 h-4 text-primary" />
                CHCCI Campus
              </div>
            </div>
          </div>
          <button class="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">
            <Plus class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Stats / Legend Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-3xl border border-white card-shadow">
          <h4 class="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Event Legend</h4>
          <div class="flex flex-wrap gap-4">
            <div class="flex items-center gap-2 border border-white shadow-sm p-2 rounded-xl bg-white/50">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <span class="text-xs font-bold text-gray-600">Academic</span>
            </div>
            <div class="flex items-center gap-2 border border-white shadow-sm p-2 rounded-xl bg-white/50">
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span class="text-xs font-bold text-gray-600">Events</span>
            </div>
            <div class="flex items-center gap-2 border border-white shadow-sm p-2 rounded-xl bg-white/50">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <span class="text-xs font-bold text-gray-600">Sports</span>
            </div>
            <div class="flex items-center gap-2 border border-white shadow-sm p-2 rounded-xl bg-white/50">
              <div class="w-3 h-3 rounded-full bg-gray-500"></div>
              <span class="text-xs font-bold text-gray-600">Holidays</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-3xl border border-gray-100 card-shadow flex items-center justify-between overflow-hidden relative">
           <div class="relative z-10">
              <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Upcoming This Month</h4>
              <div class="text-3xl font-black text-gray-900">{{ store.events.length }} Active Events</div>
           </div>
           <CalendarIcon class="w-24 h-24 text-primary/5 absolute -right-4 -bottom-4 rotate-12" />
        </div>
      </div>
    </div>

    <!-- Add Event Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div class="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 class="font-black text-gray-900 uppercase tracking-widest text-sm">Add Campus Event</h3>
          <button @click="isModalOpen = false" class="p-2 text-gray-400 hover:bg-white rounded-xl transition-all">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Title</label>
            <input v-model="newEvent.title" type="text" placeholder="e.g. Midterm Exams" class="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
              <input v-model="newEvent.date" type="date" class="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <select v-model="newEvent.type" @change="newEvent.color = eventTypes.find(t => t.id === newEvent.type).color" class="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all appearance-none">
                <option v-for="type in eventTypes" :key="type.id" :value="type.id">{{ type.label }}</option>
              </select>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description (Optional)</label>
            <textarea v-model="newEvent.description" rows="3" class="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"></textarea>
          </div>

          <button 
            @click="handleAddEvent"
            :disabled="!newEvent.title || !newEvent.date || isSubmitting"
            class="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:bg-red-800 transition-all disabled:opacity-50 mt-4"
          >
            {{ isSubmitting ? 'Posting Event...' : 'Confirm & Post Event' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-page-container {
  min-height: 100%;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 2px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
