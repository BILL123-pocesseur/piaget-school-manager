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
import { useGrades, calculateAverage } from '@/hooks/useGrades';
import { useAttendance } from '@/hooks/useAttendance';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { GradeItem } from '@/components/GradeItem';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';

function gradeColor(value: number | null): string {
  if (value === null) return colors.textSecondary;
  if (value >= 16) return colors.success;
  if (value >= 10) return colors.primary;
  return colors.error;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: grades = [] } = useGrades(user?.id);
  const { data: attendance = [] } = useAttendance(user?.id);
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();

  const myClass = classes.find((c) => c.id === user?.classId);
  const average = calculateAverage(grades);
  const absences = attendance.filter((a) => a.type === 'absence').length;
  const punitions = attendance.filter((a) => a.type === 'punition').length;

  const recentGrades = grades.slice(0, 5);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour, {user?.firstName ?? 'Élève'} 👋</Text>
            {myClass && (
              <View style={styles.classBadge}>
                <Ionicons name="library-outline" size={12} color={colors.primary} />
                <Text style={styles.classBadgeText}>{myClass.name}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Main average hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Moyenne générale</Text>
            <Text style={[styles.heroValue, { color: gradeColor(average) }]}>
              {average !== null ? `${average}/20` : '—'}
            </Text>
            {average !== null && (
              <Text style={[styles.heroMention, { color: gradeColor(average) }]}>
                {average >= 16 ? 'Excellent' : average >= 14 ? 'Très Bien' : average >= 12 ? 'Bien' : average >= 10 ? 'Passable' : 'Insuffisant'}
              </Text>
            )}
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: colors.error }]}>{absences}</Text>
              <Text style={styles.heroStatLabel}>Absence{absences !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: colors.accent }]}>{punitions}</Text>
              <Text style={styles.heroStatLabel}>Punition{punitions !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>

        {/* Quick links */}
        <View style={styles.quickLinks}>
          {[
            { label: 'Mes Notes', icon: 'bar-chart-outline', route: '/(student)/grades', color: colors.primary },
            { label: 'Conduite', icon: 'shield-outline', route: '/(student)/discipline', color: colors.warning },
            { label: 'Bulletin', icon: 'document-text-outline', route: '/(student)/bulletin', color: colors.success },
          ].map((link) => (
            <TouchableOpacity
              key={link.label}
              style={styles.quickLinkItem}
              onPress={() => router.push(link.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: link.color + '15' }]}>
                <Ionicons name={link.icon as any} size={22} color={link.color} />
              </View>
              <Text style={styles.quickLinkLabel}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent grades */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notes récentes</Text>
          <TouchableOpacity onPress={() => router.push('/(student)/grades')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {recentGrades.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={32} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Aucune note pour l'instant</Text>
          </View>
        ) : (
          <View>
            {recentGrades.map((grade) => (
              <GradeItem key={grade.id} grade={grade} subjectName={getSubjectName(grade.subjectId)} />
            ))}
          </View>
        )}
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
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  headerLeft: { gap: spacing.xs },
  greeting: { ...typography.h3, color: colors.text },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  classBadgeText: { ...typography.small, color: colors.primary, fontWeight: '600' as const },
  logoutBtn: { padding: spacing.xs, marginTop: spacing.xs },
  heroCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  heroLeft: { flex: 1 },
  heroLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  heroValue: { fontSize: 40, fontWeight: '700' as const, lineHeight: 48 },
  heroMention: { ...typography.captionBold, marginTop: spacing.xs },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroStat: { alignItems: 'center' },
  heroStatValue: { ...typography.h3 },
  heroStatLabel: { ...typography.tiny, color: colors.textSecondary, marginTop: 2 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: colors.border },
  quickLinks: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickLinkItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkLabel: { ...typography.tiny, color: colors.textSecondary, textAlign: 'center', fontWeight: '500' as const },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.h4, color: colors.text },
  seeAll: { ...typography.caption, color: colors.primary, fontWeight: '600' as const },
  emptyCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { ...typography.caption, color: colors.textSecondary },
});
