// Side-effect module: applies the stored theme synchronously. Import it as the
// very first import of each entry point so `data-theme` is set before Vuetify
// and the app load. (MV3 CSP forbids an inline <script> in the popup.)
import { applyTheme, readStoredPreference } from './theme';

if (typeof document !== 'undefined') {
  applyTheme(readStoredPreference());
}
