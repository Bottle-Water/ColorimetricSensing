import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";


export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{flex: 1}}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
          <Stack
            screenOptions={{
              headerShown: false
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
