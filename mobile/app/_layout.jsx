import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from '../src/store';
import { loadUser } from '../src/store/authSlice';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

SplashScreen.preventAutoHideAsync();

// Foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Initialize Sentry if DSN is configured (non-blocking)
let Sentry = null;
try {
  // Dynamic require so the app still works without @sentry/react-native installed
  Sentry = require('@sentry/react-native');
  if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      enableNativeNagger: false,
      tracesSampleRate: 0.2,
    });
  }
} catch {
  // @sentry/react-native not installed — skip silently
}

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useDispatch();
  const { user, initialized } = useSelector((s) => s.auth);

  // Register push notification token and handle taps
  usePushNotifications(!!user);

  useEffect(() => {
    dispatch(loadUser()).finally(() => SplashScreen.hideAsync());
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, initialized, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="course/[id]"
        options={{ headerShown: true, title: 'Course Details', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="test/[id]"
        options={{ headerShown: true, title: 'Test', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="live/[id]"
        options={{ headerShown: true, title: 'Live Class', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <AuthGate />
    </Provider>
  );
}
