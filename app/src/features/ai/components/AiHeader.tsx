// Chat header: BrandMark, persona title/subtitle, provider badge, History + New chat actions.
import { StyleSheet, View } from 'react-native';
import { AppText, BrandMark, Button, IconButton } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { AiStatus } from '@/lib/contracts';
import { spacing } from '@/theme';
import type { AiPersona } from '../config';
import { ProviderBadge } from './ProviderBadge';

export interface AiHeaderProps {
  persona: AiPersona;
  status: AiStatus | null;
  statusLoading?: boolean;
  onHistory: () => void;
  onNewChat: () => void;
  /** Disable "New chat" when the chat is already empty. */
  newChatDisabled?: boolean;
}

export function AiHeader({ persona, status, statusLoading, onHistory, onNewChat, newChatDisabled }: AiHeaderProps) {
  const { width } = useBreakpoint();
  const roomy = width >= 600;
  return (
    <View style={styles.row}>
      <BrandMark variant="icon" size="md" />
      <View style={styles.titles}>
        <AppText variant="title2" numberOfLines={1}>
          {persona.title}
        </AppText>
        <AppText variant="small" tone="muted" numberOfLines={1}>
          {persona.subtitle}
        </AppText>
        <View style={styles.badge}>
          <ProviderBadge status={status} loading={statusLoading} />
        </View>
      </View>
      {roomy ? (
        <View style={styles.actions}>
          <Button title="History" icon="time-outline" variant="outline" size="sm" onPress={onHistory} />
          <Button title="New chat" icon="add" size="sm" onPress={onNewChat} disabled={newChatDisabled} />
        </View>
      ) : (
        <View style={styles.actions}>
          <IconButton
            icon="time-outline"
            variant="outline"
            accessibilityLabel="Conversation history"
            onPress={onHistory}
          />
          <IconButton
            icon="add"
            variant="yellow"
            accessibilityLabel="New chat"
            onPress={onNewChat}
            disabled={newChatDisabled}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56 },
  titles: { flex: 1, minWidth: 0 },
  badge: { marginTop: spacing.xs, flexDirection: 'row' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
