import '@shared/theme/init';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { Ripple } from 'vuetify/directives';
import {
  VApp,
  VAlert,
  VBtn,
  VCard,
  VCardText,
  VCardTitle,
  VDivider,
  VList,
  VListItem,
  VProgressLinear,
  VSwitch,
  VTextField,
} from 'vuetify/components';
import { useAppTheme } from '@shared/theme';
import { bindVuetifyTheme, vuetifyThemes } from '@shared/theme/vuetifyTheme';
import App from './App.vue';
import './styles/main.scss';
import 'vuetify/styles';

const vuetify = createVuetify({
  components: {
    VApp,
    VAlert,
    VBtn,
    VCard,
    VCardText,
    VCardTitle,
    VDivider,
    VList,
    VListItem,
    VProgressLinear,
    VSwitch,
    VTextField,
  },
  directives: { Ripple },
  theme: {
    defaultTheme: 'light',
    themes: vuetifyThemes,
  },
});

useAppTheme().initTheme();
bindVuetifyTheme(vuetify);

createApp(App).use(createPinia()).use(vuetify).mount('#app');
