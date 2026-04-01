<script setup>
import { Wallet, History, CreditCard, ArrowRight, CheckCircle, Search, Calendar, Download, Trash2 } from 'lucide-vue-next';
import { usePortalStore } from '../stores/portalStore';
import { ref, computed } from 'vue';

const store = usePortalStore();
const showPaymentModal = ref(false);
const paymentStep = ref(1); // 1: Amount, 2: Method, 3: Success
const paymentAmount = ref(1000);
const selectedMethod = ref('');
const isProcessing = ref(false);
const paymentSuccess = ref(false);

const paymentMethods = [
  { id: 'gcash', name: 'GCash', color: 'bg-[#007DFE]', textColor: 'text-white', icon: 'Wallet' },
  { id: 'maya', name: 'Maya', color: 'bg-gradient-to-r from-[#00FF00] to-[#5D2E8E]', textColor: 'text-white', icon: 'CreditCard' },
  { id: 'bank', name: 'Online Banking', color: 'bg-slate-800', textColor: 'text-white', icon: 'Building' },
  { id: 'card', name: 'Debit/Credit Card', color: 'bg-white', textColor: 'text-slate-800', border: 'border-2 border-slate-100', icon: 'CreditCard' }
];

const openModal = () => {
  paymentStep.value = 1;
  paymentSuccess.value = false;
  showPaymentModal.value = true;
};

const goToMethods = () => {
  if (paymentAmount.value > 0) paymentStep.value = 2;
};

const handlePayment = async (method) => {
  selectedMethod.value = method.name;
  isProcessing.value = true;
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const success = await store.makePayment(paymentAmount.value, method.name);
  
  isProcessing.value = false;
  if (success) {
    paymentStep.value = 3;
    paymentSuccess.value = true;
    
    // Auto close after 3s
    setTimeout(() => {
      showPaymentModal.value = false;
    }, 3000);
  } else {
    alert('Payment failed. Please try again.');
  }
};

const reversedFinance = computed(() => {
  return [...store.finance].reverse();
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Statement of Account</h1>
        <p class="text-sm text-gray-500">Manage your tuition fees and payment history.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-4 py-2 border border-gray-100 bg-white rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all card-shadow">
          <Download class="w-4 h-4 mr-2 inline" />
          Statement PDF
        </button>
      </div>
    </div>

    <!-- Balance Card -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-1 bg-white p-8 rounded-3xl border border-gray-100 card-shadow flex flex-col justify-between relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
        <div>
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
            <Wallet class="w-6 h-6" />
          </div>
          <p class="text-xs uppercase font-bold text-gray-400 tracking-widest mb-1">Total Outstanding Balance</p>
          <h2 class="text-4xl font-black text-gray-900 mb-2">{{ store.formattedBalance }}</h2>
          <p class="text-xs text-red-500 font-semibold bg-red-50 inline-block px-2 py-1 rounded-md">DUEDATE: APRIL 15, 2026</p>
        </div>
        
        <button 
          @click="openModal"
          class="mt-8 w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-primary/30 hover:bg-red-800 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
        >
          <CreditCard class="w-5 h-5" />
          Pay Online Now
        </button>
      </div>

      <!-- Payment History Mock -->
      <div class="lg:col-span-2 bg-white rounded-3xl border border-gray-100 card-shadow overflow-hidden flex flex-col">
        <div class="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <h3 class="font-bold text-gray-800 flex items-center gap-2">
            <History class="w-5 h-5 text-primary" />
            Recent Transactions
          </h3>
        </div>
        
        <div class="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50/50 static top-0">
              <tr class="text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky top-0 bg-gray-50">
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4">Description</th>
                <th class="px-6 py-4">Type</th>
                <th class="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(entry, idx) in reversedFinance" :key="idx" class="hover:bg-gray-50 transition-colors group">
                <td class="px-6 py-4 text-sm text-gray-500 font-mono">{{ entry.date }}</td>
                <td class="px-6 py-4">
                  <p class="text-sm font-semibold text-gray-800">{{ entry.description }}</p>
                </td>
                <td class="px-6 py-4">
                  <span 
                    :class="[
                      'px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                      entry.type === 'Payment' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                    ]"
                  >
                    {{ entry.type }}
                  </span>
                </td>
                <td :class="['px-6 py-4 text-sm font-black text-right', entry.type === 'Payment' ? 'text-green-600' : 'text-gray-900']">
                  {{ entry.type === 'Payment' ? '-' : '+' }} ₱ {{ entry.amount.toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        @click="showPaymentModal = false" 
        class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      ></div>
      
      <div class="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
        
        <!-- Step 1: Amount Selection -->
        <div v-if="paymentStep === 1">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">1</div>
            <div>
              <h3 class="text-xl font-black text-gray-900">Enter Amount</h3>
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specify the total settlement amount</p>
            </div>
          </div>
          
          <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Amount to Settle (₱)</label>
              <div class="relative group">
                <input 
                  v-model.number="paymentAmount"
                  type="number" 
                  class="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl py-6 px-8 text-4xl font-black focus:outline-none focus:border-primary focus:bg-white transition-all text-center tracking-tighter"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div class="pt-4">
              <button 
                @click="goToMethods"
                class="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all group"
              >
                Choose Payment Method
                <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Payment Method Selection -->
        <div v-else-if="paymentStep === 2">
          <button @click="paymentStep = 1" class="mb-6 flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest transition-colors">
            <ArrowRight class="w-4 h-4 rotate-180" /> Back to Amount
          </button>
          
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center font-bold">2</div>
            <div>
              <h3 class="text-xl font-black text-gray-900">Select Method</h3>
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select your preferred digital wallet or bank</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 gap-3">
             <button 
                v-for="method in paymentMethods" 
                :key="method.id"
                @click="handlePayment(method)"
                :disabled="isProcessing"
                class="relative group w-full p-6 rounded-3xl transition-all border-2 border-transparent hover:border-slate-100 overflow-hidden"
                :class="[method.color, method.textColor, method.border]"
             >
                <div v-if="isProcessing && selectedMethod === method.name" class="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
                   <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
                
                <div class="flex items-center justify-between relative z-10">
                   <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                         <Wallet v-if="method.icon === 'Wallet'" class="w-6 h-6" />
                         <CreditCard v-else-if="method.icon === 'CreditCard'" class="w-6 h-6" />
                         <CreditCard v-else class="w-6 h-6" />
                      </div>
                      <div class="text-left">
                         <p class="text-xs font-black uppercase tracking-widest opacity-70">Pay using</p>
                         <p class="text-lg font-black tracking-tight">{{ method.name }}</p>
                      </div>
                   </div>
                   <ArrowRight class="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
             </button>
          </div>
        </div>

        <!-- Step 3: Success View -->
        <div v-else-if="paymentStep === 3" class="text-center py-8 space-y-6">
          <div class="relative inline-block">
            <div class="absolute inset-0 bg-green-100 rounded-full blur-2xl animate-pulse"></div>
            <div class="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-200 mx-auto animate-in zoom-in duration-500">
              <CheckCircle class="w-12 h-12" />
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="text-3xl font-black text-gray-900 tracking-tighter">Paid via {{ selectedMethod }}!</h3>
            <p class="text-gray-500 text-sm font-medium leading-relaxed">
              Your payment of <strong class="text-gray-900">₱ {{ paymentAmount.toLocaleString() }}</strong> has been successfully processed and your records are updated.
            </p>
          </div>
          <div class="bg-gray-50 p-4 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Closing in 3 seconds...</div>
        </div>

      </div>
    </div>
  </div>
</template>
