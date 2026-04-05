import { createRouter, createWebHistory } from 'vue-router';
import { usePortalStore } from '../stores/portalStore';
import DashboardView from '../views/DashboardView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/SpookyLoginView.vue'),
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guest: true }
    },
    {
      path: '/verify-email/:token',
      name: 'verify-email',
      component: () => import('../views/VerifyEmailView.vue'),
      meta: { guest: true }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/LandingView.vue'),
      meta: { guest: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, role: 'student' }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminDashboardView.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/grades',
      name: 'grades',
      component: () => import('../views/GradesView.vue'),
      meta: { requiresAuth: true, role: 'student' }
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('../views/ScheduleView.vue'),
      meta: { requiresAuth: true, role: 'student' }
    },
    {
      path: '/finance',
      name: 'finance',
      component: () => import('../views/FinanceView.vue'),
      meta: { requiresAuth: true, role: 'student' }
    },
    {
      path: '/prospectus',
      name: 'prospectus',
      component: () => import('../views/ProspectusView.vue'),
      meta: { requiresAuth: true, role: 'student' }
    },
    {
      path: '/clearance',
      name: 'clearance',
      component: () => import('../views/ClearanceView.vue'),
      meta: { requiresAuth: true, role: 'student' }
    },
    {
      path: '/wall',
      name: 'wall',
      component: () => import('../views/StudentWallView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('../views/MessagesView.vue'),
      meta: { requiresAuth: true, role: 'student' }
    }
  ]
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const store = usePortalStore();
  
  if (to.meta.requiresAuth && !store.isAuthenticated) {
    next({ name: 'login' });
  } else if (to.meta.guest && store.isAuthenticated) {
    // Redirect based on role
    if (store.isAdmin) {
      next({ name: 'admin' });
    } else {
      next({ name: 'dashboard' });
    }
  } else if (to.meta.role && store.isAuthenticated) {
    // Check role access
    if (to.meta.role === 'admin' && !store.isAdmin) {
      next({ name: 'dashboard' });
    } else if (to.meta.role === 'student' && store.isAdmin) {
      next({ name: 'admin' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
