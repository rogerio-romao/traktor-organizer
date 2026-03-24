import { createRouter, createWebHashHistory } from 'vue-router'
import CollectionView from '../views/CollectionView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: CollectionView },
  ],
})
