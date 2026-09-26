import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EmptyState, ListItem, type IoniconName } from '@/components/ui';
import { firstName, formatDateTime, formatRelative, formatTime, truncate } from '@/lib/format';
import { spacing } from '@/theme';
import type { ActivityItem } from '../activity';

export interface ActivityDirectory {
  patientName: (patientId: string) => string | undefined;
  rxLabel: (prescriptionId: string) => string | undefined;
}

interface Described {
  icon: IoniconName;
  title: string;
  subtitle: string;
  href: Href;
}

function describe(item: ActivityItem, dir: ActivityDirectory): Described {
  const name = dir.patientName(item.patientId) ?? 'A patient';
  const first = firstName(name) || name;
  const chart = `/doctor/patients/${item.patientId}` as Href;
  switch (item.kind) {
    case 'dose':
      return {
        icon: 'checkmark-done',
        title: `${first} logged a dose`,
        subtitle: `${dir.rxLabel(item.prescriptionId) ?? 'Medication'} · ${formatTime(item.slot)} dose`,
        href: chart,
      };
    case 'refill':
      return {
        icon: 'refresh-circle-outline',
        title: `${first} requested a refill`,
        subtitle: [dir.rxLabel(item.prescriptionId) ?? 'Medication', item.note ? `“${truncate(item.note, 80)}”` : null]
          .filter(Boolean)
          .join(' · '),
        href: '/doctor/inbox',
      };
    case 'message':
      return {
        icon: 'chatbubble-ellipses-outline',
        title: `New message from ${first}`,
        subtitle: truncate(item.body.replace(/\s+/g, ' '), 90),
        href: `/doctor/messages/${item.threadId}` as Href,
      };
    case 'profile':
      return {
        icon: 'person-circle-outline',
        title: `${firstName(item.name) || first} updated their profile`,
        subtitle: 'Allergies, conditions or pharmacy may have changed',
        href: chart,
      };
    case 'medication':
      return {
        icon: 'medkit-outline',
        title:
          item.status === 'discontinued'
            ? `${first} removed a self-reported medication`
            : `${first} updated their medication list`,
        subtitle: `${item.label} (self-reported)`,
        href: chart,
      };
  }
}

export interface ActivityFeedProps {
  items: readonly ActivityItem[];
  directory: ActivityDirectory;
  now?: Date;
  /** Max rows to show. */
  limit?: number;
}

/** Live, session-only activity from patients, newest first. Rows open the related screen. */
export function ActivityFeed({ items, directory, now, limit = 20 }: ActivityFeedProps) {
  if (!items.length) {
    return (
      <EmptyState
        compact
        icon="pulse-outline"
        title="Waiting for live activity"
        message="While you're signed in, doses logged, refill requests, messages and profile updates from your patients appear here instantly."
      />
    );
  }
  return (
    <View style={styles.list} accessibilityRole="list">
      {items.slice(0, limit).map((item) => {
        const d = describe(item, directory);
        return (
          <ListItem
            key={item.id}
            leftIcon={d.icon}
            title={d.title}
            subtitle={d.subtitle}
            meta={formatRelative(item.at, now)}
            titleLines={2}
            onPress={() => router.push(d.href)}
            accessibilityLabel={`${d.title}. ${d.subtitle}. ${formatDateTime(item.at)}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xxs },
});
