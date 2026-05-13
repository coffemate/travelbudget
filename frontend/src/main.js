import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { create, NButton, NCard, NConfigProvider, NDatePicker, NDialog, NDialogProvider, NForm, NFormItem, NInput, NInputNumber, NLayout, NLayoutContent, NMessageProvider, NModal, NProgress, NSegment, NSelect, NSpace, NTag } from 'naive-ui';
import App from './App.vue';
import router from './router';
import './assets/base.css';

const naive = create({
  components: [NButton, NCard, NConfigProvider, NDatePicker, NDialog, NDialogProvider, NForm, NFormItem, NInput, NInputNumber, NLayout, NLayoutContent, NMessageProvider, NModal, NProgress, NSegment, NSelect, NSpace, NTag],
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(naive);

app.mount('#app');
