import { router, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BrandMark, EmptyState, Screen } from '@/components/ui';
import { homeHrefForRole, useAuth } from '@/lib/auth';
import { spacing } from '@/theme';

/** Branded page for unknown URLs (replaces expo-router's default "Unmatched Route" screen). */
export default function NotFoundScreen() {
  const { user } = useAuth();
  const pathname = usePathname();
  const home = user ? homeHrefForRole(user.role) : '/';
  return (
    <Screen
      edges={['top', 'bottom', 'left', 'right']}
      header={
        <View style={styles.brand}>
          <BrandMark size="sm" />
        </View>
      }
    >
      <EmptyState
        icon="compass-outline"
        title="Page not found"
        message={`There’s nothing at ${pathname}. The link may be old or mistyped.`}
        actionLabel={user ? 'Go home' : 'Go to the welcome page'}
        onAction={() => router.replace(home)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', paddingVertical: spacing.sm },
});
