import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useGrades } from '@/hooks/useGrades';
import { useAttendance } from '@/hooks/useAttendance';
import { useClasses } from '@/hooks/useClasses';
import { RoleBadge } from '@/components/RoleBadge';
import { StatCard } from '@/components/StatCard';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: grades = [] } = useGrades();
  const { data: attendance = [] } = useAttendance();
  const { data: classes = [] } = useClasses();

  // Grades entered by this teacher
  const myGrades = grades.filter((g) => g.teacherId === user?.id);
  // Attendance logged by this teacher
  const myAbsences = attendance.filter((a) => a.teacherId === user?.id && a.type === 'absence');

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour, {user?.firstName ?? 'Professeur'} 👋</Text>
            <RoleBadge role="teacher" />
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Mes statistiques</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="create-outline"
            value={myGrades.length}
            label="Notes saisies"
            color={colors.primary}
            onPress={() => router.push('/(teacher)/grades')}
          />
          <StatCard
            icon="close-circle-outline"
            value={myAbsences.length}
            label="Absences enregistrées"
            color={colors.error}
            onPress={() => router.push('/(teacher)/discipline')}
          />
        </View>

        {/* Classes */}
        <Text style={styles.sectionTitle}>Mes classes</Text>
        <View style={styles.classesCard}>
          {classes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Aucune classe assignée</Text>
            </View>
          ) : (
            classes.map((cls) => (
              <View key={cls.id} style={styles.classItem}>
                <View style={styles.classIcon}>
                  <Ionicons name="library-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classMeta}>{cls.level} · {cls.academicYear}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </View>
            ))
          )}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsCard}>
          {[
            { label: 'Saisir une note', icon: 'create-outline', route: '/(teacher)/grades', color: colors.primary },
            { label: 'Enregistrer une absence', icon: 'close-circle-outline', route: '/(teacher)/discipline', color: colors.error },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionItem}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon as any} size={20} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundSecondary },
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerLeft: { gap: spacing.xs },
  greeting: { ...typography.h3, color: colors.text },
  logoutBtn: { padding: spacing.xs, marginTop: spacing.xs },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  classesCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  classIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: { flex: 1 },
  className: { ...typography.captionBold, color: colors.text },
  classMeta: { ...typography.small, color: colors.textSecondary },
  actionsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { ...typography.body, color: colors.text, flex: 1 },
  emptyState: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { ...typography.caption, color: colors.textSecondary },
});
