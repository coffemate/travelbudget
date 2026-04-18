import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { getClerk } from '../lib/clerk';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const session = ref(null);
  const loading = ref(false);
  const initialized = ref(false);
  const error = ref('');
  const clerkReady = ref(false);

  const isAuthenticated = computed(() => Boolean(session.value?.id && user.value));

  function syncFromClerk(clerk) {
    const currentUser = clerk.user;
    user.value = currentUser
      ? {
          id: currentUser.id,
          email: currentUser.primaryEmailAddress?.emailAddress || '',
        }
      : null;
    session.value = clerk.session ? { id: clerk.session.id } : null;
  }

  async function initialize() {
    if (initialized.value) return;
    const clerk = await getClerk();
    if (!clerkReady.value) {
      clerk.addListener(() => {
        syncFromClerk(clerk);
      });
      clerkReady.value = true;
    }
    syncFromClerk(clerk);
    initialized.value = true;
  }

  async function ensurePasswordAuthReady(authResource) {
    if (authResource.status === 'complete') return authResource;
    if (authResource.status === 'needs_first_factor' && typeof authResource.attemptFirstFactor === 'function') {
      const attempt = await authResource.attemptFirstFactor({
        strategy: 'password',
      });
      if (attempt.status === 'complete') return attempt;
    }
    throw new Error('Clerk 身份验证未完成，请检查账号状态或在 Clerk 控制台开启相应策略');
  }

  async function activateSession(clerk, createdSessionId) {
    if (!createdSessionId) {
      throw new Error('登录会话创建失败');
    }
    await clerk.setActive({ session: createdSessionId });
    syncFromClerk(clerk);
  }

  async function login(email, password) {
    loading.value = true;
    error.value = '';
    try {
      const clerk = await getClerk();
      const signIn = await clerk.client.signIn.create({
        identifier: email,
        password,
      });
      const attempt = await ensurePasswordAuthReady(signIn);
      await activateSession(clerk, attempt.createdSessionId);
      return { user: user.value, session: session.value };
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(email, password) {
    loading.value = true;
    error.value = '';
    try {
      const clerk = await getClerk();
      const signUp = await clerk.client.signUp.create({
        emailAddress: email,
        password,
      });

      const attempt = await ensurePasswordAuthReady(signUp);
      await activateSession(clerk, attempt.createdSessionId);
      return { user: user.value, session: session.value };
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    error.value = '';
    try {
      const clerk = await getClerk();
      await clerk.signOut();
      syncFromClerk(clerk);
      initialized.value = true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    session,
    loading,
    initialized,
    error,
    isAuthenticated,
    initialize,
    login,
    register,
    logout,
  };
});
