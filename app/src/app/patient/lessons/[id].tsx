// Lesson reader route. Unknown ids get a friendly not-found screen.
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import type { ScrollView } from 'react-native';
import { Screen, ScreenHeader } from '@/components/ui';
import {
  LessonReader,
  LessonsNotFound,
  categoryHref,
  categoryTitle,
  lessonNeighbors,
  paramValue,
  setLastOpenedLesson,
} from '@/features/lessons';
import { getLesson } from '@/lessons';

export default function LessonScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = paramValue(params.id);
  const lesson = id ? getLesson(id) : undefined;
  const lessonId = lesson?.id;
  const scrollRef = useRef<ScrollView>(null);

  // Remember the lesson for "Continue reading" whenever this screen is focused.
  useFocusEffect(
    useCallback(() => {
      if (lessonId) void setLastOpenedLesson(lessonId);
    }, [lessonId]),
  );

  // If the same screen instance is reused for another lesson (previous/next), start at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [lessonId]);

  if (!lesson) {
    return (
      <LessonsNotFound
        title="Lesson"
        heading="Lesson not found"
        message="We couldn't find that lesson. It may have moved or been renamed. Browse the library to find it."
      />
    );
  }

  const { position, total } = lessonNeighbors(lesson);

  return (
    <Screen
      scrollRef={scrollRef}
      gap="xl"
      header={
        <ScreenHeader
          title={categoryTitle(lesson.categoryId)}
          subtitle={total > 1 && position > 0 ? `Lesson ${position} of ${total}` : undefined}
          back={categoryHref(lesson.categoryId)}
        />
      }
    >
      <LessonReader key={lesson.id} lesson={lesson} />
    </Screen>
  );
}
