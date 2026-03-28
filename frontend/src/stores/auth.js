import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../lib/supabase';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const session = ref(null);
  const loading = ref(false);
  const initialized = ref(false);
  const error = ref('');

  const isAuthenticated = computed(() => Boolean(session.value?.access_token && user.value));

  async function initialize() {
    if (initialized.value) return;
    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    user.value = data.session?.user || null;
    initialized.value = true;

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession;
      user.value = newSession?.user || null;
      initialized.value = true;
    });
  }

  async function login(email, password) {
    loading.value = true;
    error.value = '';
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      session.value = data.session;
      user.value = data.user;
      return data;
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
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      session.value = data.session || null;
      user.value = data.user || null;
      return data;
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
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      session.value = null;
      user.value = null;
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
