import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText, Badge, Button, Input } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import type { HealthResponse } from '@/lib/contracts';
import { normalizeServerUrl, useServerUrl, type ServerUrlSource } from '@/lib/server-url';
import { colors, radius, spacing } from '@/theme';

const SOURCE_LABEL: Record<ServerUrlSource, string> = {
  saved: 'Saved on this device',
  env: 'Set by the app’s configuration',
  'web-host': 'Auto-detected from this page',
  'expo-host': 'Auto-detected from the Expo dev server',
  tunnel: 'Opened through an Expo tunnel, which can’t reach the server',
  default: 'Default',
};

/** Help under the address field. */
function sourceHint(source: ServerUrlSource): string {
  if (source === 'tunnel') {
    return `${SOURCE_LABEL.tunnel}. Share the server with a tunnel of its own (e.g. ngrok or localtunnel) and enter its https:// address.`;
  }
  return `${SOURCE_LABEL[source]}. The computer running the BRIAN server prints its address when it starts.`;
}

type TestResult = { ok: true; health: HealthResponse; saved: boolean } | { ok: false; message: string };

export interface ServerSettingsFormProps {
  /** Called after a successful connection test (the URL has been saved if it changed). */
  onConnected?: (health: HealthResponse) => void;
  /** Autofocus the URL field. */
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Summarise the AI/evidence mode reported by /api/health. */
export function describeAiMode(health: HealthResponse): string {
  return health.ai.provider === 'anthropic'
    ? `Full AI — Claude${health.ai.model ? ` (${health.ai.model})` : ''}`
    : 'Demo mode — no ANTHROPIC_API_KEY on the server';
}

/** Server URL editor with "Test connection" (GET /api/health). Saves the URL when the test succeeds. */
export function ServerSettingsForm({ onConnected, autoFocus, style }: ServerSettingsFormProps) {
  const { url, override, detected, source, setServerUrl } = useServerUrl();
  // Tunnel mode has no usable detected address: start empty so the user types the public one.
  const shownUrl = source === 'tunnel' ? '' : url;
  const [draft, setDraft] = useState(shownUrl);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  // Keep the field in sync when the effective URL changes elsewhere.
  useEffect(() => {
    setDraft(shownUrl);
  }, [shownUrl]);

  const invalid = draft.trim() !== '' && !normalizeServerUrl(draft);

  const test = async () => {
    const target = normalizeServerUrl(draft);
    if (!target) {
      setResult({ ok: false, message: 'Enter a valid address, e.g. http://192.168.1.23:4000' });
      return;
    }
    setTesting(true);
    setResult(null);
    try {
      const health = await api.health(target);
      let saved = false;
      if (target !== url) {
        await setServerUrl(target === detected ? null : target);
        saved = true;
      }
      setResult({ ok: true, health, saved });
      onConnected?.(health);
    } catch (e) {
      setResult({ ok: false, message: errorMessage(e) });
    } finally {
      setTesting(false);
    }
  };

  const useAutomatic = async () => {
    await setServerUrl(null);
    setResult(null);
  };

  return (
    <View style={[styles.container, style]}>
      <Input
        label="Server address"
        value={draft}
        onChangeText={(t) => {
          setDraft(t);
          setResult(null);
        }}
        placeholder={source === 'tunnel' ? 'https://your-server.example.com' : 'http://192.168.1.23:4000'}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        inputMode="url"
        autoFocus={autoFocus}
        returnKeyType="go"
        onSubmitEditing={test}
        leftIcon="server-outline"
        error={invalid ? 'That doesn’t look like a web address.' : null}
        hint={sourceHint(source)}
      />
      <View style={styles.actions}>
        <Button title="Test connection" icon="pulse" onPress={test} loading={testing} disabled={invalid} />
        {override ? (
          <Button title="Use automatic" variant="ghost" icon="refresh" onPress={useAutomatic} disabled={testing} />
        ) : null}
      </View>
      {result ? (
        result.ok ? (
          <View style={[styles.result, styles.resultOk]} accessibilityLiveRegion="polite" accessible>
            <AppText variant="bodyStrong" tone="success">
              Connected to BRIAN {result.health.version}
              {result.saved ? ' — address saved' : ''}
            </AppText>
            <AppText variant="small">{describeAiMode(result.health)}</AppText>
            <View style={styles.badges}>
              {(['pubmed', 'medlineplus', 'openfda', 'rxnorm'] as const).map((k) => (
                <Badge
                  key={k}
                  label={{ pubmed: 'PubMed', medlineplus: 'MedlinePlus', openfda: 'openFDA', rxnorm: 'RxNorm' }[k]}
                  tone={result.health.ai.evidence[k] ? 'success' : 'neutral'}
                  icon={result.health.ai.evidence[k] ? 'checkmark' : 'remove'}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.result, styles.resultError]} accessibilityLiveRegion="polite" accessible>
            <AppText variant="bodyStrong" tone="danger">
              Couldn’t connect
            </AppText>
            <AppText variant="small">{result.message}</AppText>
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  result: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md },
  resultOk: { backgroundColor: colors.successLight },
  resultError: { backgroundColor: colors.dangerLight },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
});
