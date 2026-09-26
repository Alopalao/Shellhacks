import { DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppText, BrandMark, Button, ConfirmProvider, ToastProvider } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { SocketProvider } from '@/lib/socket';
import { colors, spacing } from '@/theme';

// Keep the native splash up until the saved session has been read.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.black,
    background: colors.background,
    card: colors.white,
    text: colors.text,
    border: colors.border,
    notification: colors.yellow,
  },
};

function SplashGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hide();
  }, [status]);
  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={styles.root}>
      <ThemeProvider value={navigationTheme}>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <ConfirmProvider>
                <SplashGate>
                  <StatusBar style="dark" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: colors.background },
                      animation: 'fade',
                    }}
                  >
                    <Stack.Screen name="index" options={{ title: 'BRIAN' }} />
                    <Stack.Screen name="login" options={{ title: 'Sign in · BRIAN' }} />
                    <Stack.Screen name="patient" options={{ title: 'BRIAN' }} />
                    <Stack.Screen name="doctor" options={{ title: 'BRIAN for clinicians' }} />
                  </Stack>
                </SplashGate>
              </ConfirmProvider>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Branded crash screen (expo-router renders this if any route throws while rendering). */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.error}>
      <BrandMark size="md" />
      <AppText variant="title2" align="center">
        Something went wrong
      </AppText>
      <AppText tone="muted" align="center" style={styles.errorText}>
        {error.message || 'An unexpected error occurred.'}
      </AppText>
      <Button title="Try again" icon="refresh" onPress={() => void retry()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: { maxWidth: 420 },
});
