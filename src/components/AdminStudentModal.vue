<script setup>
import { ref, watch, onMounted } from 'vue';
import { usePortalStore } from '../stores/portalStore';
import { X, Save, ShieldCheck, RefreshCw, BookOpen, User as UserIcon, Plus, Trash2 } from 'lucide-vue-next';

const props = defineProps({
  editing: Object,
  defaultTab: String
});

const emit = defineEmits(['close']);
const store = usePortalStore();

const activeTab = ref(props.defaultTab || 'info'); // 'info' or 'subjects'
const subjects = ref([]);
const newSubject = ref({
  code: '',
  name: '',
  units: 3,
  time: '',
  room: '',
  instructor: '',
  grade: '0.00',
  status: 'Passed'
});

const form = ref({
  id: '',
  name: '',
  password: '',
  program: 'BSCS',
  year: '1st Year',
  avg: '0.00',
  balance: 0
});

const isSaving = ref(false);
const isAddingSubject = ref(false);

onMounted(async () => {
  if (props.editing) {
    form.value = { ...props.editing };
    subjects.value = await store.fetchStudentSubjects(props.editing.id);
  } else {
    generateStudentId();
  }
});

const generateStudentId = () => {
  if (props.editing) return;
  const random = Math.floor(Math.random() * 9000) + 1000;
  form.value.id = `5176${random}`;
};

const handleSave = async () => {
  isSaving.value = true;
  let success = false;
  
  if (props.editing) {
    success = await store.updateStudent(props.editing.id, form.value);
  } else {
    success = await store.createStudent(form.value);
  }

  if (success) {
    emit('close');
  } else {
    alert('Failed to save student record.');
  }
  isSaving.value = false;
};

const handleAddSubject = async () => {
  if (!newSubject.value.code || !newSubject.value.name) return;
  
  isAddingSubject.value = true;
  const success = await store.addSubjectToStudent(form.value.id, newSubject.value);
  
  if (success) {
    subjects.value = await store.fetchStudentSubjects(form.value.id);
    newSubject.value = { code: '', name: '', units: 3, time: '', room: '', instructor: '', grade: '0.00', status: 'Passed' };
  } else {
    alert('Subject assignment failed. Please check the information and try again.');
  }
  isAddingSubject.value = false;
};

const handleRemoveSubject = async (id) => {
  if (await store.removeSubject(id)) {
    subjects.value = await store.fetchStudentSubjects(form.value.id);
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md">
    <div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95 duration-300">
      <!-- Header -->
      <div class="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 class="text-2xl font-black text-gray-800 tracking-tight">{{ props.editing ? 'Student Profile Manager' : 'Enroll New Student' }}</h2>
          <p class="text-sm text-gray-500 mt-0.5">Control academic records and account status</p>
        </div>
        <button @click="emit('close')" class="p-3 text-gray-400 hover:text-primary hover:bg-white rounded-2xl shadow-sm border border-gray-100 transition-all">
          <X :size="24" />
        </button>
      </div>

      <!-- Tabs Nav -->
      <div class="flex px-8 bg-gray-50/50 border-b border-gray-50">
        <button 
          @click="activeTab = 'info'"
          :class="['flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2', activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600']"
        >
          <UserIcon :size="18" /> Account Details
        </button>
        <button 
          v-if="props.editing"
          @click="activeTab = 'subjects'"
          :class="['flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2', activeTab === 'subjects' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600']"
        >
          <BookOpen :size="18" /> Academic Load
        </button>
      </div>

      <!-- Scrollable Area -->
      <div class="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
        <!-- INFO TAB -->
        <div v-if="activeTab === 'info'" class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2 col-span-2 sm:col-span-1">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Student ID</label>
              <div class="relative">
                <input v-model="form.id" disabled type="text" class="w-full pl-4 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-400 font-mono font-bold">
                <button v-if="!props.editing" @click="generateStudentId" class="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/5 rounded-xl"><RefreshCw :size="20" /></button>
              </div>
            </div>

            <div class="space-y-2 col-span-2 sm:col-span-1">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <input v-model="form.name" type="text" class="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-gray-700">
            </div>

            <div class="space-y-2 col-span-2">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Update Password {{ props.editing ? '(Leave blank to keep current)' : '' }}</label>
              <input 
                v-model="form.password" 
                type="password" 
                @copy.prevent 
                @paste.prevent 
                @contextmenu.prevent
                placeholder="Disallow Copy/Paste for Security"
                class="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-gray-700"
              >
            </div>

            <div class="space-y-2">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Program</label>
              <select v-model="form.program" class="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-gray-700 appearance-none">
                <option>BSCS</option><option>BSIT</option><option>BSIS</option><option>BSEMC</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Year Level</label>
              <select v-model="form.year" class="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-gray-700 appearance-none">
                <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Balance (₱)</label>
              <input v-model.number="form.balance" type="number" class="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-gray-700">
            </div>

            <div class="space-y-2">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">GWA Average</label>
              <input v-model="form.avg" type="text" class="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all font-bold text-gray-700">
            </div>
          </div>
        </div>

        <!-- SUBJECTS TAB -->
        <div v-if="activeTab === 'subjects'" class="space-y-8">
          <!-- Add Subject Form -->
          <div class="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
            <h3 class="text-sm font-black text-gray-400 uppercase tracking-widest px-2">Assign New Subject</h3>
            <div class="grid grid-cols-4 gap-3">
              <input v-model="newSubject.code" placeholder="Code (CS301)" class="col-span-1 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary font-bold text-sm">
              <input v-model="newSubject.name" placeholder="Subject Name" class="col-span-2 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary font-bold text-sm">
              <input v-model.number="newSubject.units" type="number" class="col-span-1 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary font-bold text-sm">
              <input v-model="newSubject.grade" placeholder="Grade" class="col-span-1 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary font-bold text-sm">
              <input v-model="newSubject.time" placeholder="Time (9:00AM)" class="col-span-1 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary font-bold text-sm">
              <input v-model="newSubject.instructor" placeholder="Instructor" class="col-span-1 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary font-bold text-sm">
              <button @click="handleAddSubject" :disabled="isAddingSubject" class="col-span-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark disabled:opacity-50 transition-all">
                <Plus v-if="!isAddingSubject" :size="18" /> 
                <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ isAddingSubject ? '...' : 'Add' }}
              </button>
            </div>
          </div>

          <!-- Existing Subjects List -->
          <div class="space-y-3">
            <div v-for="sub in subjects" :key="sub.id" class="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center font-black text-xs">{{ sub.code }}</div>
                <div>
                  <p class="font-bold text-gray-700">{{ sub.name }}</p>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ sub.time }} • {{ sub.instructor }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-sm font-black" :class="parseFloat(sub.grade) <= 3.0 ? 'text-green-600' : 'text-red-600'">{{ sub.grade }}</p>
                  <p class="text-[10px] text-gray-400 font-bold uppercase">{{ sub.status }}</p>
                </div>
                <button @click="handleRemoveSubject(sub.id)" class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 font-bold text-[9px] uppercase tracking-wider">
                  <Trash2 :size="14" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
            <div v-if="subjects.length === 0" class="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">No subjects assigned yet.</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-8 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/20">
        <button @click="emit('close')" class="px-8 py-4 text-gray-500 hover:text-gray-800 font-black uppercase tracking-widest text-xs transition-all">Cancel</button>
        <button 
          @click="handleSave"
          :disabled="isSaving"
          class="flex items-center gap-3 bg-primary hover:bg-red-800 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary/20"
        >
          <Save v-if="!isSaving" :size="20" />
          <div v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          {{ props.editing ? 'Save Records' : 'Enroll Student' }}
        </button>
      </div>
    </div>
  </div>
</template>
