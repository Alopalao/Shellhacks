import type { Href } from 'expo-router';
import { EmptyState, Screen, ScreenHeader } from '@/components/ui';

export interface PlaceholderScreenProps {
  title: string;
  /** Back button target (for nested screens). */
  back?: boolean | Href;
  message?: string;
}

/** Temporary screen used until a feature agent replaces the route file. */
export function PlaceholderScreen({ title, back, message }: PlaceholderScreenProps) {
  return (
    <Screen header={<ScreenHeader title={title} back={back} />}>
      <EmptyState
        icon="construct-outline"
        title="Coming soon"
        message={message ?? 'This part of BRIAN is being built. Check back shortly.'}
      />
    </Screen>
  );
}
