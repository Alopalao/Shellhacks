import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Default "Confirm". */
  confirmLabel?: string;
  /** Default "Cancel". */
  cancelLabel?: string;
  /** Red confirm button for destructive actions. */
  destructive?: boolean;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Spinner on the confirm button (keep the dialog open while working). */
  loading?: boolean;
}

/** Controlled in-app confirmation modal (works on web, unlike Alert.alert). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Close dialog" accessibilityRole="button" />
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <AppText variant="title3">{title}</AppText>
          {message ? (
            <AppText variant="body" tone="muted">
              {message}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <Button title={cancelLabel} variant="outline" onPress={onCancel} disabled={loading} style={styles.action} />
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={loading}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Provides `useConfirm()`. Mounted once in the root layout. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  // Closing only flips `open`: the last options stay rendered so the dialog keeps its title and
  // button labels/colours while the modal fades out (instead of flashing an empty "Confirm" card).
  const [dialog, setDialog] = useState<{ open: boolean; options: ConfirmOptions }>({
    open: false,
    options: { title: '' },
  });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setDialog((d) => (d.open ? { ...d, open: false } : d));
  }, []);

  const confirm = useCallback<ConfirmFn>((opts) => {
    resolver.current?.(false); // only one dialog at a time
    setDialog({ open: true, options: opts });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const value = useMemo(() => confirm, [confirm]);
  const { open, options } = dialog;

  return (
    <ConfirmContext value={value}>
      {children}
      <ConfirmDialog
        visible={open}
        title={options.title}
        message={options.message}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        destructive={options.destructive}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext>
  );
}

/**
 * Promise-based confirm: `if (await confirm({ title: 'Discontinue?', destructive: true })) …`.
 * Resolves true on confirm, false on cancel/backdrop.
 */
export function useConfirm(): ConfirmFn {
  const ctx = use(ConfirmContext);
  if (!ctx) throw new Error('useConfirm() must be used inside <ConfirmProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    ...shadow.raised,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { flex: 1, alignSelf: 'stretch' },
});
