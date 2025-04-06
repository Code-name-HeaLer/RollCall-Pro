import 'react-native-get-random-values';
// Use Stack as the primary navigator
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Platform, Alert, StatusBar } from 'react-native';
import { DataProvider, useData } from '../src/context/DataContext';
import * as Notifications from 'expo-notifications';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { getThemeColors } from '../src/utils/theme';
// Ionicons are not needed here anymore, will be used in (tabs)/_layout.tsx
// import { Ionicons } from '@expo/vector-icons';

// Request notification permissions
async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        // Alert the user or handle the case where permission is denied
        console.log('Failed to get push token for push notification!');
        // Optionally show an alert: Alert.alert('Permission Required', 'Notifications are needed for class reminders.');
        return;
    }
    // // Get the Expo push token (Not needed for local notifications, but good practice)
    // try {
    //     const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    //     token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    //     console.log("Expo Push Token:", token);
    // } catch (e) {
    //     console.error("Error getting Expo push token:", e);
    // }

    return token; // For now, we just care about permission status
}

// Inner component to access context after provider
function ThemedAppLayout() {
  const { settings, isLoading } = useData();
  const router = useRouter();

  // Refs for notification listeners
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // useEffect for notification permissions/listeners (keep this)
  useEffect(() => {
    registerForPushNotificationsAsync().catch(err => {
        console.error("Error registering for notifications:", err);
        Alert.alert("Notification Error", "Could not set up notifications. Reminders may not work.");
    });

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Response Received:', response);
      const courseId = response.notification.request.content.data?.courseId;
      if (courseId) {
        console.log(`Navigating to course: ${courseId}`);
        router.push(`/course/${courseId}` as any);
      }
    });

    // Cleanup listeners on component unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);

  // Keep loading check
  if (isLoading || !settings) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Get theme colors from our utility
  const colors = getThemeColors(settings.theme);

  return (
    <>
      {/* Set status bar style based on theme */}
      <StatusBar
        barStyle={settings.theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBackground} // Use standard header background
      />

      {/* Use Stack Navigator for all screens */}
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.headerText,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        {/* Tab screens - we'll handle the tab bar separately */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Non-tab modal and detail screens */}
        <Stack.Screen name="add-course" options={{ title: 'Add Course', presentation: 'modal' }} />
        <Stack.Screen name="course/[id]" options={{ title: 'Course Details' }} />
        <Stack.Screen name="edit-course/[id]" options={{ title: 'Edit Course', presentation: 'modal' }} />
        <Stack.Screen name="timetable" options={{ title: 'Manage Timetable' }} />
      </Stack>
    </>
  );
}

// Main export wraps the app with the providers
export default function RootLayout() {
  return (
    <DataProvider>
      <ActionSheetProvider>
        <ThemedAppLayout />
      </ActionSheetProvider>
    </DataProvider>
  );
}
