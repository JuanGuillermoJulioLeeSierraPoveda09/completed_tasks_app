import { createElement } from 'react';
import { registerRootComponent } from 'expo';
import { useFonts } from '@expo-google-fonts/plus-jakarta-sans';

import App from './App';
import { FONT_ASSETS } from './fonts';

// Waits for Plus Jakarta Sans so no text flashes in the system font on startup.
function Root() {
  const [fontsLoaded] = useFonts(FONT_ASSETS);
  if (!fontsLoaded) return null;
  return createElement(App);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
