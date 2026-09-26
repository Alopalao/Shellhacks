// In-app toasts (top banners). Also shows every `notify` socket event, tappable → its `href`.
// Works on web (no Alert.alert).
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LiveNotification, LiveNotificationKind } from '@/lib/contracts';
import { useSocketEvent } from '@/lib/socket';
import { colors, radius, shadow, spacing } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export type ToastKind = LiveNotificationKind | 'success' | 'error' | 'info';

export interface ToastOptions {
  title: string;
  body?: string;
  /** Picks the icon/colour. Default `info`. */
  kind?: ToastKind;
  /** In-app route opened when the toast is tapped. */
  href?: string;
  /** Custom tap handler (runs instead of navigating). */
  onPress?: () => void;
  /** Auto-dismiss delay (default 5 s; errors 7 s). */
  durationMs?: number;
  /** Dedupe key — a toast with an id that is already visible is ignored. */
  id?: string;
}

export interface ToastApi {
  /** Show a toast; returns its id. */
  show: (options: ToastOptions) => string;
  success: (title: string, body?: string) => string;
  error: (title: string, body?: string) => string;
  info: (title: string, body?: string) => string;
  dismiss: (id: string) => void;
}

interface ToastItem extends Required<Pick<ToastOptions, 'title' | 'kind' | 'durationMs'>> {
  id: string;
  body?: string;
  href?: string;
  onPress?: () => void;
}

const MAX_VISIBLE = 3;

const KIND_STYLE: Record<ToastKind, { icon: IoniconName; bg: string; fg: string }> = {
  message: { icon: 'chatbubble-ellipses', bg: colors.yellow, fg: colors.textOnYellow },
  prescription: { icon: 'medkit', bg: colors.yellow, fg: colors.textOnYellow },
  refill: { icon: 'refresh-circle', bg: colors.yellow, fg: colors.textOnYellow },
  note: { icon: 'document-text', bg: colors.yellow, fg: colors.textOnYellow },
  dose: { icon: 'checkmark-done', bg: colors.yellow, fg: colors.textOnYellow },
  system: { icon: 'notifications', bg: colors.yellow, fg: colors.textOnYellow },
  info: { icon: 'information-circle', bg: colors.yellow, fg: colors.textOnYellow },
  success: { icon: 'checkmark-circle', bg: colors.successLight, fg: colors.success },
  error: { icon: 'alert-circle', bg: colors.dangerLight, fg: colors.danger },
};

const ToastContext = createContext<ToastApi | null>(null);

let counter = 0;
const nextId = () => `toast_${Date.now().toString(36)}_${(counter++).toString(36)}`;

function samePath(a: string, b: string): boolean {
  const norm = (p: string) => p.split('?')[0]!.replace(/\/+$/, '') || '/';
  return norm(a) === norm(b);
}

/** Provides `useToast()` and renders the toast stack. Must be inside SocketProvider (listens for `notify`). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pathname = usePathname();

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions): string => {
    const id = options.id ?? nextId();
    const kind = options.kind ?? 'info';
    const item: ToastItem = {
      id,
      title: options.title,
      body: options.body,
      kind,
      href: options.href,
      onPress: options.onPress,
      durationMs: options.durationMs ?? (kind === 'error' ? 7_000 : 5_000),
    };
    setToasts((list) => (list.some((t) => t.id === id) ? list : [item, ...list].slice(0, MAX_VISIBLE)));
    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(options.body ? `${options.title}. ${options.body}` : options.title);
    }
    return id;
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (title, body) => show({ title, body, kind: 'success' }),
      error: (title, body) => show({ title, body, kind: 'error' }),
      info: (title, body) => show({ title, body, kind: 'info' }),
    }),
    [show, dismiss],
  );

  // Live notifications from the server (skip ones pointing at the screen the user is already on).
  useSocketEvent('notify', (n: LiveNotification) => {
    if (n.href && samePath(n.href, pathname)) return;
    show({ id: n.id, title: n.title, body: n.body, kind: n.kind, href: n.href });
  });

  return (
    <ToastContext value={api}>
      <View style={styles.flex}>
        {children}
        <ToastViewport toasts={toasts} onDismiss={dismiss} />
      </View>
    </ToastContext>
  );
}

/** `const toast = useToast(); toast.success('Saved');` */
export function useToast(): ToastApi {
  const ctx = use(ToastContext);
  if (!ctx) throw new Error('useToast() must be used inside <ToastProvider>');
  return ctx;
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;
  return (
    <View pointerEvents="box-none" style={[styles.viewport, { top: insets.top + spacing.sm }]}>
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [anim] = useState(() => new Animated.Value(0));
  const leaving = useRef(false);
  const useNative = Platform.OS !== 'web';
  const k = KIND_STYLE[toast.kind];
  const tappable = !!(toast.href || toast.onPress);

  const close = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: useNative }).start(() => onDismiss(toast.id));
  }, [anim, onDismiss, toast.id, useNative]);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: useNative, friction: 8, tension: 80 }).start();
    const timer = setTimeout(close, toast.durationMs);
    return () => clearTimeout(timer);
  }, [anim, close, toast.durationMs, useNative]);

  const onPress = () => {
    if (toast.onPress) toast.onPress();
    else if (toast.href) router.push(toast.href as Href);
    close();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        },
      ]}
    >
      <View style={styles.card}>
        <Pressable
          onPress={tappable ? onPress : undefined}
          disabled={!tappable}
          accessibilityRole={tappable ? 'button' : 'alert'}
          accessibilityLabel={toast.body ? `${toast.title}. ${toast.body}` : toast.title}
          accessibilityHint={tappable ? 'Opens the related screen' : undefined}
          accessibilityLiveRegion="polite"
          style={({ pressed }) => [styles.main, pressed && tappable && styles.mainPressed]}
        >
          <View style={[styles.iconCircle, { backgroundColor: k.bg }]}>
            <Ionicons name={k.icon} size={18} color={k.fg} />
          </View>
          <View style={styles.texts}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {toast.title}
            </AppText>
            {toast.body ? (
              <AppText variant="small" tone="muted" numberOfLines={2}>
                {toast.body}
              </AppText>
            ) : null}
          </View>
          {tappable ? <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} /> : null}
        </Pressable>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          hitSlop={4}
          style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  viewport: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 1000,
    elevation: 1000,
  },
  cardWrap: { width: '100%', maxWidth: 520 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingRight: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.raised,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm + 2,
    alignSelf: 'stretch',
  },
  mainPressed: { backgroundColor: colors.yellowLighter },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 1 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  closePressed: { backgroundColor: colors.surfaceMuted },
});
