// Patient Home: greeting, today's dose checklist, progress + next dose, doctor, latest note,
// refills, quick actions and emergency numbers. Live over Socket.IO; pull to refresh.
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  Card,
  Disclaimer,
  EmergencyStrip,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import { DoctorCard, LatestNoteCard, QuickActions, RefillChips, TodayProgressCard, useLiveDashboard } from '@/features/home';
import { buildChecklist, DoseChecklist } from '@/features/meds';
import { explainNoteHref, patientNoteHref } from '@/features/notes';
import { useNow } from '@/hooks/useInterval';
import { useAuth } from '@/lib/auth';
import { dateKey, displayName, firstName, formatDate, greeting } from '@/lib/format';
import { spacing } from '@/theme';

export default function PatientHomeScreen() {
  const { user } = useAuth();
  const now = useNow(60_000);
  const today = dateKey(now);
  const dashboard = useLiveDashboard(today, user?.id);
  const { data, error, loading, refreshing, refresh, doses } = dashboard;

  const name = firstName(user?.name);
  const header = (
    <ScreenHeader
      eyebrow={formatDate(now, { weekday: true, long: true, omitCurrentYear: true })}
      title={name ? `${greeting(now)}, ${name}` : greeting(now)}
    />
  );

  if (loading) {
    return (
      <Screen header={header} scroll={false}>
        <LoadingState label="Loading your day…" />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen header={header} refreshing={refreshing} onRefresh={refresh}>
        <ErrorState error={error} title="Couldn’t load your day" onRetry={() => void refresh()} />
        <EmergencyStrip />
      </Screen>
    );
  }

  const checklist = buildChecklist(data.prescriptions, data.todayDoses, today, now);
  const doctor = data.doctor;
  const note = data.latestNote;
  const openChat = () => router.push('/patient/care/chat');
  const addMedication = () => router.push('/patient/meds/add');

  return (
    <Screen header={header} refreshing={refreshing} onRefresh={refresh} gap="xl">
      <TodayProgressCard checklist={checklist} today={today} now={now} onAddMedication={addMedication} />

      <View style={styles.section}>
        <SectionHeader
          title="Today"
          icon="checkbox-outline"
          subtitle={checklist.total ? 'Tap a dose when you take it. Tap again to undo.' : undefined}
          actionLabel="All meds"
          onAction={() => router.push('/patient/meds')}
        />
        {checklist.total ? (
          <DoseChecklist checklist={checklist} doses={doses} />
        ) : (
          <Card variant="muted">
            <EmptyState
              compact
              icon="medkit-outline"
              title="Nothing to take today"
              message={
                data.prescriptions.length
                  ? 'None of your medicines have reminder times today.'
                  : 'When your doctor prescribes something, it shows up here. You can also add vitamins or OTC medicines.'
              }
              actionLabel="Add a medicine"
              onAction={addMedication}
            />
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Your care team" icon="people-outline" />
        <DoctorCard
          doctor={doctor}
          onlineFallback={data.doctorOnline}
          unreadMessages={data.unreadMessages}
          onMessage={openChat}
          onChooseDoctor={() => router.push('/patient/profile')}
        />
      </View>

      {note ? (
        <LatestNoteCard
          note={note}
          doctorName={doctor && doctor.id === note.doctorId ? displayName(doctor) : undefined}
          onExplain={() => router.push(explainNoteHref(note.id))}
          onOpen={() => router.push(patientNoteHref(note.id))}
        />
      ) : null}

      <RefillChips
        prescriptions={data.prescriptions}
        pending={data.pendingRefills}
        onOpen={(id) => router.push(`/patient/meds/${id}`)}
        onSeeAll={() => router.push('/patient/meds')}
        now={now}
      />

      <View style={styles.section}>
        <SectionHeader title="Quick actions" icon="flash-outline" />
        <QuickActions
          actions={[
            {
              key: 'ai',
              label: 'Ask BRIAN',
              caption: 'Your AI health guide',
              icon: 'sparkles',
              onPress: () => router.push('/patient/ai'),
            },
            {
              key: 'message',
              label: 'Message doctor',
              caption: doctor ? displayName(doctor) : 'Choose a doctor first',
              icon: 'chatbubble-ellipses',
              badge: data.unreadMessages,
              onPress: doctor ? openChat : () => router.push('/patient/profile'),
            },
            {
              key: 'lessons',
              label: 'Lessons',
              caption: 'Health know-how in 5 minutes',
              icon: 'school',
              onPress: () => router.push('/patient/lessons'),
            },
            {
              key: 'add',
              label: 'Add medication',
              caption: 'OTC medicine or supplement',
              icon: 'add-circle',
              onPress: addMedication,
            },
          ]}
        />
      </View>

      <EmergencyStrip />
      <Disclaimer compact />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
});
