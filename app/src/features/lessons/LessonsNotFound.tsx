// Friendly "not found" screen for unknown lesson / topic ids.
import { router } from 'expo-router';
import { EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { LESSONS_HOME_HREF } from './helpers';

export interface LessonsNotFoundProps {
  /** Header title ("Lesson", "Topic"). */
  title: string;
  heading: string;
  message: string;
}

export function LessonsNotFound({ title, heading, message }: LessonsNotFoundProps) {
  return (
    <Screen header={<ScreenHeader title={title} back={LESSONS_HOME_HREF} />}>
      <EmptyState
        icon="book-outline"
        title={heading}
        message={message}
        actionLabel="Browse all lessons"
        onAction={() => router.dismissTo(LESSONS_HOME_HREF)}
      />
    </Screen>
  );
}
