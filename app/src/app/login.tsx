import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { LgtmConfirmation } from '@/components/auth/LgtmConfirmation';
import { ServerSettingsForm } from '@/components/settings/ServerSettingsForm';
import {
  AppText,
  Avatar,
  BrandMark,
  Button,
  Card,
  IconButton,
  Input,
  Screen,
  SegmentedControl,
  useToast,
} from '@/components/ui';
import { errorMessage, isNetworkError } from '@/lib/api';
import { homeHrefForRole, useAuth } from '@/lib/auth';
import type { LoginRequest, LoginResponse, Role } from '@/lib/contracts';
import { useServerUrl } from '@/lib/server-url';
import { colors, radius, spacing } from '@/theme';

type Pending = 'form' | 'demo-patient' | 'demo-doctor' | null;

const DEMO = {
  patient: { email: 'patient@brian.demo', password: 'demo', label: 'Demo patient', who: 'Maya Johnson' },
  doctor: { email: 'doctor@brian.demo', password: 'demo', label: 'Demo doctor', who: 'Dr. Daniel Reyes' },
} as const;

const SUCCESS_DELAY_MS = 900;

export default function LoginScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const { status, user, login } = useAuth();
  const { url, source } = useServerUrl();
  const toast = useToast();

  const [role, setRole] = useState<Role>(params.role === 'doctor' ? 'doctor' : 'patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<LoginResponse | null>(null);
  const [showServer, setShowServer] = useState(false);

  const connectedToastId = useRef<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  // After the LGTM confirmation, route by role.
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.replace(homeHrefForRole(success.user.role)), SUCCESS_DELAY_MS);
    return () => clearTimeout(t);
  }, [success]);

  if (status === 'signed-in' && user && !pending && !success) {
    return <Redirect href={homeHrefForRole(user.role)} />;
  }

  const emailError = attempted && !email.trim() ? 'Enter any email address.' : null;
  const passwordError = attempted && !password ? 'Enter any password (e.g. "demo").' : null;
  // Opened via `expo start --tunnel`: the server's address must be entered before anything works.
  const tunnel = source === 'tunnel';
  const offline = isNetworkError(error);

  const submit = async (req: LoginRequest, which: Exclude<Pending, null>) => {
    if (pending) return;
    setPending(which);
    setError(null);
    try {
      const res = await login(req);
      if (connectedToastId.current) toast.dismiss(connectedToastId.current);
      setSuccess(res); // keep `pending` set so the screen doesn't redirect before the confirmation
    } catch (e) {
      setError(e);
      setPending(null);
    }
  };

  const onSubmitForm = () => {
    setAttempted(true);
    if (!email.trim() || !password) return;
    void submit({ email, password, role, name: name.trim() || undefined }, 'form');
  };

  const busy = pending !== null;

  return (
    <View style={styles.flex}>
      <Screen edges={['top', 'bottom', 'left', 'right']} maxWidth={480} gap="xl">
        <View style={styles.topBar}>
          <IconButton
            icon="chevron-back"
            variant="outline"
            accessibilityLabel="Back to welcome"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
          <BrandMark size="sm" />
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.heading}>
          <AppText variant="title1">Sign in to BRIAN</AppText>
          <AppText tone="muted">
            Demo mode: any email and password work. A new email creates an account.
          </AppText>
        </View>

        {tunnel ? (
          <Card variant="outline" style={styles.serverCard}>
            <View style={styles.serverHeader}>
              <View style={[styles.serverIcon, styles.tunnelIcon]}>
                <Ionicons name="git-network-outline" size={20} color={colors.text} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">Tunnel mode: connect to your BRIAN server</AppText>
                <AppText variant="small" tone="muted">
                  This app was opened through an Expo tunnel, which carries the app but not the BRIAN server. Share
                  the server with a tunnel of its own (e.g. ngrok or localtunnel) and enter its https:// address.
                </AppText>
              </View>
            </View>
            <ServerSettingsForm
              onConnected={() => {
                setError(null);
                connectedToastId.current = toast.success('Connected', 'Now sign in.');
              }}
            />
          </Card>
        ) : null}

        <View style={styles.form}>
          <SegmentedControl<Role>
            accessibilityLabel="I am a"
            value={role}
            onChange={setRole}
            disabled={busy}
            options={[
              { value: 'patient', label: "I'm a patient", icon: 'person-outline' },
              { value: 'doctor', label: "I'm a doctor", icon: 'medkit-outline' },
            ]}
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            inputMode="email"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
            leftIcon="mail-outline"
            error={emailError}
            editable={!busy}
          />
          <Input
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Any password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => nameRef.current?.focus()}
            leftIcon="lock-closed-outline"
            error={passwordError}
            editable={!busy}
            right={
              <IconButton
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                size={36}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
          />
          <Input
            ref={nameRef}
            label="Your name"
            optional
            value={name}
            onChangeText={setName}
            placeholder={role === 'doctor' ? 'Dr. Jane Smith' : 'Jane Smith'}
            autoComplete="name"
            textContentType="name"
            returnKeyType="go"
            onSubmitEditing={onSubmitForm}
            leftIcon="person-outline"
            hint="Only used when this email is new."
            editable={!busy}
          />

          {error && !offline ? (
            <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <AppText variant="bodyStrong" tone="danger">
                Couldn’t sign in
              </AppText>
              <AppText variant="small">{errorMessage(error)}</AppText>
            </View>
          ) : null}

          {offline && !tunnel ? (
            <Card variant="outline" style={styles.serverCard}>
              <View style={styles.serverHeader}>
                <View style={styles.serverIcon}>
                  <Ionicons name="cloud-offline-outline" size={20} color={colors.danger} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">Can’t reach the BRIAN server</AppText>
                  <AppText variant="small" tone="muted">
                    Tried {url}. Make sure the server is running (npm run server) and this device is on the same
                    network, or enter the address it printed on start.
                  </AppText>
                </View>
              </View>
              <ServerSettingsForm
                onConnected={() => {
                  setError(null);
                  connectedToastId.current = toast.success('Connected', 'Now sign in again.');
                }}
              />
            </Card>
          ) : null}

          <Button
            title="Continue"
            size="lg"
            fullWidth
            icon="arrow-forward"
            iconPosition="right"
            loading={pending === 'form'}
            disabled={busy && pending !== 'form'}
            onPress={onSubmitForm}
          />
        </View>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <AppText variant="caption" tone="subtle">
            OR TRY THE DEMO
          </AppText>
          <View style={styles.orLine} />
        </View>

        <View style={styles.demoRow}>
          {(['patient', 'doctor'] as const).map((r) => {
            const d = DEMO[r];
            const which = r === 'patient' ? 'demo-patient' : 'demo-doctor';
            return (
              <Card
                key={r}
                variant={r === 'patient' ? 'yellow' : 'outline'}
                padding="md"
                style={styles.demoCard}
                onPress={busy ? undefined : () => void submit({ email: d.email, password: d.password }, which)}
                accessibilityLabel={`${d.label}: sign in as ${d.who}`}
              >
                <Avatar
                  user={{ name: d.who, avatar: r === 'doctor' ? 'doctor-photo' : null }}
                  size={40}
                  accessibilityLabel=""
                />
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{d.label}</AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {d.who}
                  </AppText>
                </View>
                {pending === which ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color={colors.text} />
                )}
              </Card>
            );
          })}
        </View>

        {/* In tunnel mode the server form is already open at the top. */}
        {tunnel ? null : (
          <View style={styles.footer}>
            <Pressable
              onPress={() => setShowServer((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={`Server ${url}. ${showServer ? 'Hide' : 'Change'} server settings`}
              hitSlop={8}
              style={styles.footerLink}
            >
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                Server: {url} ·{' '}
                <AppText variant="caption" weight="semibold" style={styles.underline}>
                  {showServer ? 'Hide' : 'Change'}
                </AppText>
              </AppText>
            </Pressable>
            {showServer && !offline ? (
              <Card variant="outline">
                <ServerSettingsForm autoFocus />
              </Card>
            ) : null}
          </View>
        )}
      </Screen>
      {success ? <LgtmConfirmation name={success.user.name} isNewUser={success.isNewUser} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSpacer: { width: 44 },
  heading: { gap: spacing.sm },
  form: { gap: spacing.lg },
  errorBox: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerLight },
  serverCard: { gap: spacing.md },
  serverHeader: { flexDirection: 'row', gap: spacing.md },
  serverIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
  },
  tunnelIcon: { backgroundColor: colors.yellowLight },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  demoCard: { flexGrow: 1, flexBasis: 200, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64 },
  footer: { gap: spacing.md, alignItems: 'stretch' },
  footerLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
