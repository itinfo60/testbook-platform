import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on a physical device');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('No EAS project ID found — cannot get Expo push token');
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}

/**
 * Registers device push token with the backend and sets up notification tap handler.
 * Must be called once in the root layout after the user is authenticated.
 */
export function usePushNotifications(isAuthenticated) {
  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register and store token
    registerForPushNotificationsAsync().then((token) => {
      if (!token) return;
      authAPI.registerFcmToken(token).catch(() => {});
    });

    // Handle notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Notification is shown by the system; no extra action needed here
    });

    // Handle tap on a notification (foreground or background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (!data) return;

      if (data.type === 'liveclass_reminder' && data.liveClassId) {
        router.push(`/live/${data.liveClassId}`);
      } else if (data.type === 'new_message' && data.discussionId) {
        router.push(`/discussions/${data.discussionId}`);
      } else if (data.courseId) {
        router.push(`/course/${data.courseId}`);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated]);
}
