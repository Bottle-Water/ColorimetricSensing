import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";


export default function RootLayout() {
  return (
    <>
      <SafeAreaView style={{flex: 1}}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
          <Stack screenOptions={{headerShown: false}} >
            <Stack.Screen name="index" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <StatusBar style="auto" />
    </>
  );
}
