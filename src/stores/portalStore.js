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
    ],
    chatMessages: [],
    conversations: [],
    contacts: [],
    theme: localStorage.getItem('chcci_theme') || 'midnight',
    attendanceData: [
      { date: '2026-03-01', status: 'present' },
      { date: '2026-03-02', status: 'present' },
      { date: '2026-03-03', status: 'absent' },
      { date: '2026-03-04', status: 'present' },
      // ... more mock data added dynamically via logic if needed
    ],
    events: [],
    organizations: [],
    orgApplications: [], // For Admin
  }),
  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    unreadNotifications: (state) => state.notifications.filter(n => !n.read).length,
    unreadMessages: (state) => state.conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0),
    totalUnits: (state) => state.grades.reduce((acc, curr) => acc + curr.units, 0),
    formattedBalance: (state) => `₱ ${(state.user?.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
  },
  actions: {
    // --- CHAT ACTIONS (Unified for Admin & Students) ---
    async fetchMyMessages() {
      try {
        const response = await api.get('/chat/conversations');
        this.conversations = response.data;
        return response.data;
      } catch (error) {
        console.error('Fetch conversations failed:', error);
        return [];
      }
    },
    async fetchChatContacts() {
      try {
        const response = await api.get('/chat/contacts');
        this.contacts = response.data;
        return response.data;
      } catch (error) {
        console.error('Fetch contacts failed:', error);
        return [];
      }
    },
    async fetchPeerChat(otherId) {
      if (!otherId) return [];
      try {
        const response = await api.get(`/chat/messages/${otherId}`);
        this.chatMessages = response.data;
        // Mark as read when opened
        api.put(`/chat/messages/read/${otherId}`).catch(() => {});
        return response.data;
      } catch (error) {
        console.error('Fetch peer chat failed:', error);
        return [];
      }
    },
    async sendMessage(recipientId, content) {
      try {
        const response = await api.post('/chat/messages', { content, receiver_id: recipientId });
        this.chatMessages.push(response.data);
        return response.data;
      } catch (error) {
        console.error('Send message failed:', error);
        return null;
      }
    },
    async markAsRead(peerId) {
      try {
        await api.put(`/chat/messages/read/${peerId}`);
        const conversation = this.conversations.find(c => c.id === peerId);
        if (conversation) conversation.unread_count = 0;
      } catch (error) {
        console.error('Mark read failed:', error);
      }
    },

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
      
      // Perform a clean redirect to the landing page to purge all reactive states
      window.location.href = '/';
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
        const response = await api.delete(`/admin/students/${id}`);
        await this.fetchStudents();
        return { success: true, message: response.data.message };
      } catch (error) {
        console.error('Delete student failed:', error);
        return { success: false, message: error.response?.data?.error || 'Deletion failed.' };
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
        
        // Dynamic GWA Calculation
        if (subjectsWithDefaults.length > 0 && this.user) {
          const totalUnits = subjectsWithDefaults.reduce((acc, s) => acc + (s.units || 0), 0);
          const totalGradePoints = subjectsWithDefaults.reduce((acc, s) => {
            const grade = parseFloat(s.grade) || 0;
            return acc + (grade * (s.units || 0));
          }, 0);
          
          if (totalUnits > 0) {
            const calculatedGwa = (totalGradePoints / totalUnits).toFixed(2);
            this.user.avg = calculatedGwa;
            // Also sync to localStorage
            localStorage.setItem('chcci_active_user', JSON.stringify(this.user));
          }
        }
        
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
    async downloadReport() {
      try {
        // Fetch fresh stats
        const stats = await this.fetchAdminStats();
        // Create a simple CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Metric,Value\n";
        csvContent += `Total Students,${stats.totalStudents}\n`;
        csvContent += `Total Balance,${stats.totalBalance}\n`;
        csvContent += `Critical Average,${stats.criticalAverage}\n\n`;
        csvContent += "Program,Student Count\n";
        stats.programDistribution.forEach(p => {
          csvContent += `${p.program},${p.count}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `CHCCI_Campus_Report_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      } catch (error) {
        console.error('Report generation failed:', error);
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
    async updateSubject(id, subjectData) {
      try {
        await api.put(`/admin/subjects/${id}`, subjectData);
        return true;
      } catch (error) {
        console.error('Update subject failed:', error);
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
    async updateProfile(profileData) {
      try {
        const response = await api.put('/student/profile', profileData);
        this.user = response.data.user;
        localStorage.setItem('chcci_active_user', JSON.stringify(this.user));
        return { success: true, message: response.data.message };
      } catch (error) {
        console.error('Update profile failed:', error);
        const message = error.response?.data?.error || 'Failed to update profile';
        return { success: false, message };
      }
    },
    markNotificationsRead() {
      this.notifications.forEach(n => n.read = true);
    },

    // --- STUDENT WALL ACTIONS ---
    async fetchWallPosts() {
      try {
        const response = await api.get('/wall/posts');
        return response.data;
      } catch (error) {
        console.error('Fetch wall posts failed:', error);
        return [];
      }
    },
    async createWallPost(content, type = 'post', imageFile = null) {
      try {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('type', type);
        if (imageFile) {
          formData.append('image', imageFile);
        }
        
        const response = await api.post('/wall/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      } catch (error) {
        console.error('Create wall post failed:', error);
        return null;
      }
    },
    async togglePostReaction(postId, commentId = null, type = 'like') {
      try {
        const response = await api.post('/wall/react', { 
          post_id: postId, 
          comment_id: commentId, 
          type 
        });
        return response.data;
      } catch (error) {
        console.error('Toggle reaction failed:', error);
        return null;
      }
    },
    async fetchPostComments(postId) {
      try {
        const response = await api.get(`/wall/posts/${postId}/comments`);
        return response.data;
      } catch (error) {
        console.error('Fetch comments failed:', error);
        return [];
      }
    },
    async addPostComment(postId, content, parentId = null) {
      try {
        const response = await api.post('/wall/comments', { 
          post_id: postId, 
          content, 
          parent_id: parentId 
        });
        return response.data;
      } catch (error) {
        console.error('Add comment failed:', error);
        return null;
      }
    },
    async deleteWallPost(postId) {
      try {
        await api.delete(`/wall/posts/${postId}`);
        return true;
      } catch (error) {
        console.error('Delete post failed:', error);
        return false;
      }
    },
    // --- CALENDAR ACTIONS ---
    async fetchCalendarEvents() {
      try {
        const response = await api.get('/calendar/events');
        this.events = response.data;
        return response.data;
      } catch (error) {
        console.error('Fetch events failed:', error);
        return [];
      }
    },
    async createCalendarEvent(eventData) {
      try {
        const response = await api.post('/calendar/events', eventData);
        this.events.push(response.data);
        return response.data;
      } catch (error) {
        console.error('Create event failed:', error);
        return null;
      }
    },
    // --- ORGANIZATION ACTIONS ---
    async fetchOrganizations() {
      try {
        const response = await api.get('/organizations');
        this.organizations = response.data;
        return response.data;
      } catch (error) {
        console.error('Fetch organizations failed:', error);
        return [];
      }
    },
    async createOrganization(orgData) {
      try {
        const response = await api.post('/organizations', orgData);
        this.organizations.push(response.data);
        return response.data;
      } catch (error) {
        console.error('Create organization failed:', error);
        return null;
      }
    },
    async deleteOrganization(id) {
      try {
        await api.delete(`/organizations/${id}`);
        this.organizations = this.organizations.filter(o => o.id !== id);
        return true;
      } catch (error) {
        console.error('Delete organization failed:', error);
        return false;
      }
    },
    async applyForOrganization(orgId) {
      try {
        const response = await api.post(`/organizations/${orgId}/apply`);
        // Refresh local status
        await this.fetchOrganizations();
        return response.data;
      } catch (error) {
        console.error('Application failed:', error);
        return null;
      }
    },
    async fetchOrgApplications() {
      try {
        const response = await api.get('/admin/organizations/applications');
        this.orgApplications = response.data;
        return response.data;
      } catch (error) {
        console.error('Fetch apps failed:', error);
        return [];
      }
    },
    
    // --- SYSTEM SETTINGS ACTIONS ---
    async fetchSettings() {
      try {
        const response = await api.get('/settings');
        return response.data;
      } catch (error) {
        console.error('Fetch settings failed:', error);
        return { announcement: 'Welcome to the CHCCI Student Portal!' };
      }
    },
    async updateSettings(announcement) {
      try {
        const response = await api.put('/settings', { announcement });
        return response.data;
      } catch (error) {
        console.error('Update settings failed:', error);
        return null;
      }
    },

    setTheme(theme) {
      this.theme = theme;
      localStorage.setItem('chcci_theme', theme);
      // We apply to body for global access
      document.body.className = `theme-${theme}`;
    }
  }
});
