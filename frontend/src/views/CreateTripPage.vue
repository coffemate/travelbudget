<template>
  <section class="page-stack">
    <TripForm @submit="handleCreateTrip" />

    <p v-if="store.loading" class="helper-text">Loading...</p>
    <p v-if="store.error" class="helper-text text-danger">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router';
import TripForm from '../components/TripForm.vue';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const router = useRouter();
const authStore = useAuthStore();
const store = useBudgetStore();

async function handleCreateTrip(payload) {
  await store.createTripAction(payload, authStore.user?.id);
  await router.push('/expense');
}
</script>
