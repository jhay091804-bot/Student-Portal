<script setup>
import { computed } from 'vue';
import { usePortalStore } from '../stores/portalStore';

const props = defineProps({
  name: { type: String, default: '' },
  avatar: { type: String, default: null },
  size: { type: String, default: 'w-10 h-10' },
  role: { type: String, default: 'student' },
  badge: { type: Boolean, default: false }
});

const store = usePortalStore();

const initials = computed(() => {
  return store.getInitials(props.name);
});

const isPrimary = computed(() => props.role === 'admin' || props.name?.toLowerCase().includes('admin'));

const containerClasses = computed(() => [
  props.size,
  'rounded-2xl flex items-center justify-center overflow-hidden border shadow-sm transition-transform hover:scale-105',
  props.avatar 
    ? 'bg-white border-slate-100' 
    : (isPrimary.value 
        ? 'bg-primary/10 border-primary/20 text-primary font-black' 
        : 'bg-[#002147]/10 border-[#002147]/20 text-[#002147] font-black')
]);
</script>

<template>
  <div :class="containerClasses" :title="name">
    <img v-if="avatar" :src="avatar" :alt="name" class="w-full h-full object-cover" />
    <span v-else class="text-[40%] uppercase tracking-tighter">{{ initials }}</span>
    
    <!-- Optional Role Badge (Simple dot) -->
    <div v-if="badge && isPrimary" class="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white ring-1 ring-blue-100"></div>
  </div>
</template>
