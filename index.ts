// CRITICAL: Import background task registry FIRST
// TaskManager.defineTask must run before React initializes
import './src/background/BackgroundTaskRegistry';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
