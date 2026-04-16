<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ top: 0, left: 0 }) }
});

const emit = defineEmits(['select', 'close']);

const reactions = [
  { id: 'like', emoji: '❤️', label: 'Heart', color: 'text-red-500' },
  { id: 'haha', emoji: '😂', label: 'Haha', color: 'text-amber-400' },
  { id: 'wow', emoji: '😮', label: 'Wow', color: 'text-blue-400' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'text-indigo-400' },
  { id: 'angry', emoji: '😡', label: 'Angry', color: 'text-orange-600' }
];

const closeMenu = (e) => {
  emit('close');
};

const handleSelect = (id) => {
  emit('select', id);
  emit('close');
};
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[100]" @mousedown="closeMenu">
    <div 
      class="absolute bg-white rounded-full shadow-2xl border border-slate-100 p-1.5 flex items-center gap-1 animate-in zoom-in-95 fade-in duration-200"
      :style="{ top: `${position.top}px`, left: `${position.left}px`, transform: 'translate(-50%, -100%) translateY(-10px)' }"
      @mousedown.stop
    >
      <button 
        v-for="reaction in reactions" 
        :key="reaction.id"
        @click="handleSelect(reaction.id)"
        class="w-10 h-10 flex items-center justify-center text-2xl hover:scale-150 active:scale-110 transition-all duration-300 group relative"
      >
        <span class="z-10">{{ reaction.emoji }}</span>
        <span class="absolute -bottom-8 bg-[#002147] text-white text-[9px] font-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
          {{ reaction.label }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation-fill-mode: both;
}
@keyframes zoom-in-95 {
  from { opacity: 0; transform: translate(-50%, -100%) translateY(-10px) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, -100%) translateY(-10px) scale(1); }
}
</style>
