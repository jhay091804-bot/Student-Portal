import { defineStore } from 'pinia';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE
});

// Request Interceptor for Auth
api.interceptors.request.use(config => {
  const token = localStorage.getItem('chcci_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const usePortalStore = defineStore('portal', {
  state: () => ({
    isAuthenticated: !!localStorage.getItem('chcci_token'),
    authLoading: false,
    user: JSON.parse(localStorage.getItem('chcci_active_user')) || null,
    students: [], // For Admin CRUD
    notifications: [
      { id: 1, text: 'Your midterm clearance is approved', read: false, time: '2h ago' },
      { id: 2, text: 'Library book overdue: Software Engineering', read: false, time: '1d ago' }
    ],
    schedule: [
      { 
        id: 101,
        time: '09:00 AM - 10:30 AM', 
        subject: 'Software Engineering', 
        room: 'Room 302', 
        instructor: 'Dr. Santos', 
        color: 'bg-blue-50 text-blue-700 border-blue-100',
        iconColor: 'bg-blue-100 text-blue-600'
      },
      { 
        id: 102,
        time: '01:00 PM - 03:00 PM', 
        subject: 'Web Development', 
        room: 'Computer Lab 1', 
        instructor: 'Engr. Reyes', 
        color: 'bg-purple-50 text-purple-700 border-purple-100',
        iconColor: 'bg-purple-100 text-purple-600'
      }
    ],
    grades: [
      { code: 'CS301', name: 'Software Engineering', grade: '1.25', units: 3, status: 'Passed' },
      { code: 'CS302', name: 'Web Development', grade: '1.50', units: 3, status: 'Passed' },
      { code: 'CS303', name: 'Mobile Computing', grade: '1.75', units: 3, status: 'Passed' },
      { code: 'CS304', name: 'Networking 1', grade: '1.50', units: 3, status: 'Passed' },
      { code: 'GEN101', name: 'Ethics', grade: '1.00', units: 3, status: 'Passed' }
    ],
    finance: [
      { date: '2024-03-15', description: 'Tuition Fee - Second Semester', amount: 15000, type: 'Charge' },
      { date: '2024-03-20', description: 'Downpayment', amount: 10000, type: 'Payment' },
      { date: '2026-04-01', description: 'Online Payment (Portal)', amount: 2000, type: 'Payment' }
    ]
  }),
  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    unreadNotifications: (state) => state.notifications.filter(n => !n.read).length,
    totalUnits: (state) => state.grades.reduce((acc, curr) => acc + curr.units, 0),
    formattedBalance: (state) => `₱ ${(state.user?.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
  },
  actions: {
    async signIn(id, password) {
      this.authLoading = true;
      try {
        const response = await api.post('/auth/login', { id, password });
        const { token, user } = response.data;
        
        this.isAuthenticated = true;
        this.user = user;
        
        localStorage.setItem('chcci_token', token);
        localStorage.setItem('chcci_active_user', JSON.stringify(user));
        
        this.authLoading = false;
        return true;
      } catch (error) {
        if (error.response?.status === 403) {
           this.authLoading = false;
           return { 
             success: false, 
             unverified: true, 
             message: error.response.data.message, 
             email: error.response.data.email 
           };
        }
        const message = error.response?.data?.error || error.response?.data?.message || 'Login failed. Please check your connection.';
        console.error('Login failed:', message);
        this.authLoading = false;
        return { success: false, message };
      }
    },
    signOut() {
      this.isAuthenticated = false;
      this.user = null;
      localStorage.removeItem('chcci_token');
      localStorage.removeItem('chcci_active_user');
    },
    async signUp(userData) {
      this.authLoading = true;
      try {
        const response = await api.post('/auth/register', userData);
        this.authLoading = false;
        return { 
          success: true, 
          message: response.data.message, 
          unverified: response.data.unverified 
        };
      } catch (error) {
        const message = error.response?.data?.error || error.response?.data?.message || 'Registration failed.';
        console.error('Registration failed:', message);
        this.authLoading = false;
        return { success: false, message };
      }
    },

    // --- ADMIN CRUD ---
    async fetchStudents() {
      try {
        const response = await api.get('/admin/students');
        this.students = response.data;
      } catch (error) {
        console.error('Fetch students failed:', error);
      }
    },
    async createStudent(studentData) {
      try {
        await api.post('/admin/students', studentData);
        await this.fetchStudents();
        return true;
      } catch (error) {
        console.error('Create student failed:', error);
        return false;
      }
    },
    async updateStudent(id, studentData) {
      try {
        await api.put(`/admin/students/${id}`, studentData);
        await this.fetchStudents();
        return true;
      } catch (error) {
        console.error('Update student failed:', error);
        return false;
      }
    },
    async deleteStudent(id) {
      try {
        await api.delete(`/admin/students/${id}`);
        await this.fetchStudents();
        return true;
      } catch (error) {
        console.error('Delete student failed:', error);
        return false;
      }
    },

    // --- STUDENT SUBJECT ACTIONS ---
    async fetchMySubjects() {
      try {
        const response = await api.get('/student/subjects');
        const subjectsWithDefaults = response.data.map((s, idx) => ({
          ...s,
          iconColor: s.iconColor || (idx % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'),
          color: s.color || (idx % 2 === 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100')
        }));
        this.grades = subjectsWithDefaults;
        this.schedule = subjectsWithDefaults;
        return subjectsWithDefaults;
      } catch (error) {
        console.error('Fetch my subjects failed:', error);
        return [];
      }
    },

    // --- ADMIN ACTIONS ---
    async fetchAdminStats() {
      try {
        const response = await api.get('/admin/stats');
        return response.data;
      } catch (error) {
        console.error('Fetch stats failed:', error);
        return null;
      }
    },
    async fetchSettings() {
      try {
        const response = await api.get('/admin/settings');
        return response.data;
      } catch (error) {
        console.error('Fetch settings failed:', error);
        return null;
      }
    },
    async updateSettings(settings) {
      try {
        await api.post('/admin/settings', settings);
        return true;
      } catch (error) {
        console.error('Update settings failed:', error);
        return false;
      }
    },

    // --- ADMIN SUBJECT ACTIONS ---
    async fetchStudentSubjects(id) {
      try {
        const response = await api.get(`/admin/students/${id}/subjects`);
        return response.data;
      } catch (error) {
        console.error('Fetch subjects failed:', error);
        return [];
      }
    },
    async addSubjectToStudent(id, subjectData) {
      try {
        await api.post(`/admin/students/${id}/subjects`, subjectData);
        return true;
      } catch (error) {
        console.error('Add subject failed:', error);
        return false;
      }
    },
    async removeSubject(subjectId) {
      try {
        await api.delete(`/admin/subjects/${subjectId}`);
        return true;
      } catch (error) {
        console.error('Remove subject failed:', error);
        return false;
      }
    },

    async makePayment(amount, method) {
      try {
        const response = await api.post('/student/payment', { amount, method });
        // Update local user state
        if (this.user) {
          this.user.balance = response.data.newBalance;
          localStorage.setItem('chcci_active_user', JSON.stringify(this.user));
        }
        // Add to history locally for instant feel
        this.finance.push(response.data.transaction);
        return true;
      } catch (error) {
        console.error('Payment failed:', error);
        return false;
      }
    },
    markNotificationsRead() {
      this.notifications.forEach(n => n.read = true);
    }
  }
});
