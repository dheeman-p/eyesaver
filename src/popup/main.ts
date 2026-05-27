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
    themes: {
      light: {
        colors: {
          primary: '#00897B',
        },
      },
    },
  },
});

createApp(App).use(createPinia()).use(vuetify).mount('#app');
