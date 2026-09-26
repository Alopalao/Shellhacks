import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, BrandMark, Button, Disclaimer } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { homeHrefForRole, useAuth } from '@/lib/auth';
import { colors, fontWeight, radius, shadow, spacing } from '@/theme';

const doctorPhoto = require('@/assets/images/doctor.jpg');

const TAGLINE = 'Your AI doctor, your real doctor, your meds — together.';

const ACRONYM = [
  { letter: 'B', title: 'Built for patients', body: 'Plain-language answers and a home screen that puts you first.' },
  { letter: 'R', title: 'Reliable prescription management', body: 'Doses, refills and reminders in one place.' },
  { letter: 'I', title: 'Integrated AI doctor', body: 'Ask BRIAN anything, with sources from NIH, FDA and PubMed.' },
  { letter: 'A', title: 'Always connected to your physician', body: 'Live chat and visit notes from your doctor.' },
  { letter: 'N', title: 'Next-generation healthcare', body: 'Your care team and your AI, working together.' },
] as const;

export default function Welcome() {
  const { status, user } = useAuth();
  const { isWide, width, height } = useBreakpoint();
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [fade]);

  if (status === 'loading') return <View style={styles.blank} />;
  if (status === 'signed-in' && user) return <Redirect href={homeHrefForRole(user.role)} />;

  // Phones: cap the photo by the screen height so the wordmark shows on the first screen too.
  const photoSize = isWide ? Math.min(420, width * 0.32) : Math.max(160, Math.min(260, width - 120, height * 0.28));

  const hero = (
    <View style={[styles.band, isWide && styles.bandWide]}>
      <View style={[styles.photoFrame, { width: photoSize, height: photoSize * 1.12 }]}>
        <Image
          source={doctorPhoto}
          style={styles.photo}
          contentFit="cover"
          contentPosition="top"
          transition={250}
          accessibilityLabel="A smiling physician in a navy suit and glasses"
        />
      </View>
      <View style={[styles.floatingCard, isWide ? styles.floatingCardWide : null]}>
        <View style={styles.onlineDot} />
        <View>
          <AppText variant="label">Your physician, one tap away</AppText>
          <AppText variant="caption" tone="muted">
            Real-time messages · visit notes · refills
          </AppText>
        </View>
      </View>
    </View>
  );

  const actionButtons = (
    <>
      <Button
        title="Get started"
        size="lg"
        icon="arrow-forward"
        iconPosition="right"
        onPress={() => router.push('/login')}
        accessibilityHint="Sign in or create an account"
        style={isWide ? null : styles.stickyAction}
      />
      <Button
        title="I'm a doctor"
        size="lg"
        variant="outline"
        icon="medkit-outline"
        onPress={() => router.push({ pathname: '/login', params: { role: 'doctor' } })}
        accessibilityHint="Sign in as a clinician"
        style={isWide ? null : styles.stickyAction}
      />
    </>
  );

  const copy = (
    <View style={[styles.copy, isWide && styles.copyWide]}>
      <View style={styles.wordmarkBlock}>
        <View>
          <View style={styles.wordmarkUnderline} />
          <AppText style={[styles.wordmark, isWide && styles.wordmarkWide]} accessibilityRole="header">
            BRIAN
          </AppText>
        </View>
        <AppText variant={isWide ? 'title3' : 'lead'} weight="semibold" style={styles.tagline}>
          {TAGLINE}
        </AppText>
      </View>

      <View style={styles.acronym} accessibilityRole="list" accessibilityLabel="What BRIAN stands for">
        {ACRONYM.map((item) => (
          <View
            key={item.letter}
            style={styles.acronymRow}
            accessible
            accessibilityLabel={`${item.letter}: ${item.title}. ${item.body}`}
          >
            <View style={styles.letterTile}>
              <AppText style={styles.letter}>{item.letter}</AppText>
            </View>
            <View style={styles.acronymText}>
              <AppText variant="bodyStrong">{item.title}</AppText>
              <AppText variant="small" tone="muted">
                {item.body}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      {isWide ? <View style={[styles.actions, styles.actionsWide]}>{actionButtons}</View> : null}
      <Disclaimer compact text="BRIAN is a demo. It shares general health information and is not a substitute for professional medical care. In an emergency, call 911." />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.page, isWide && styles.pageWide, { opacity: fade }]}>
          <View style={styles.topBar}>
            <BrandMark size="sm" variant="icon" />
            <Button title="Sign in" variant="ghost" size="sm" onPress={() => router.push('/login')} />
          </View>
          {isWide ? (
            <View style={styles.twoCol}>
              {copy}
              <View style={styles.heroCol}>{hero}</View>
            </View>
          ) : (
            <View style={styles.stack}>
              {hero}
              {copy}
            </View>
          )}
        </Animated.View>
      </ScrollView>
      {/* Phones: the two main actions stay pinned at the bottom instead of below the fold. */}
      {isWide ? null : (
        <View style={styles.stickyBar}>
          <View style={styles.stickyRow}>{actionButtons}</View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  page: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  pageWide: { flexGrow: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  stack: { gap: spacing.xl },
  twoCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xxxl, paddingVertical: spacing.xl },
  heroCol: { flex: 1, alignItems: 'stretch' },
  band: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl + 8,
    backgroundColor: colors.yellowLight,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  bandWide: { paddingVertical: spacing.xxxl + spacing.xl },
  photoFrame: {
    borderRadius: 32,
    borderWidth: 6,
    borderColor: colors.white,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadow.raised,
  },
  photo: { width: '100%', height: '100%' },
  floatingCard: {
    position: 'absolute',
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  floatingCardWide: { bottom: spacing.xl },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.online },
  copy: { gap: spacing.xl },
  copyWide: { flex: 1, maxWidth: 520 },
  wordmarkBlock: { gap: spacing.md, alignItems: 'flex-start' },
  wordmarkUnderline: {
    position: 'absolute',
    left: -4,
    right: -4,
    bottom: 8,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.yellow,
  },
  wordmark: { fontSize: 56, lineHeight: 64, fontWeight: fontWeight.heavy, letterSpacing: 3 },
  wordmarkWide: { fontSize: 72, lineHeight: 80 },
  tagline: { maxWidth: 460 },
  acronym: { gap: spacing.md },
  acronymRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  letterTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: 22, lineHeight: 26, fontWeight: fontWeight.heavy, color: colors.textOnYellow },
  acronymText: { flex: 1, gap: 1 },
  actions: { gap: spacing.sm },
  actionsWide: { flexDirection: 'row', flexWrap: 'wrap' },
  stickyBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stickyRow: { flexDirection: 'row', gap: spacing.sm, width: '100%', maxWidth: 560, alignSelf: 'center' },
  stickyAction: { flex: 1, alignSelf: 'stretch', paddingHorizontal: spacing.md },
});
