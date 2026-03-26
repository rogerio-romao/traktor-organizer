import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './router';

import App from './App.vue';

// oxlint-disable-next-line import/no-unassigned-import -- Side-effect import for global styles
import './assets/styles/main.css';

createApp(App).use(createPinia()).use(router).mount('#app');
