// App entry. Expo Router renders the app; Android also needs its widget task registered
// here, at startup, because Android can run it while the app is closed.
import 'expo-router/entry';

import { registerHomeWidgets } from '@/widgets/register';

registerHomeWidgets();
