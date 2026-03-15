import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useStudents } from '@/hooks/useStudents';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { StatCard } from '@/components/StatCard';
import { RoleBadge } from '@/components/RoleBadge';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import type { User } from '@/types';

function RecentStudentItem({ student, classes }: { student: User; classes: any[] }) {
  const cls = classes.find((c) => c.id === student.classId);
  const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <View style={styles.studentItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{student.firstName} {student.lastName}</Text>
        <Text style={styles.studentMeta}>{student.matricule} · {cls?.name ?? 'Sans classe'}</Text>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();

  const recentStudents = students.slice(0, 5);

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
            <Text style={styles.greeting}>Bonjour, {user?.firstName ?? 'Admin'} 👋</Text>
            <RoleBadge role="admin" />
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats grid */}
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="people-outline"
              value={students.length}
              label="Total Élèves"
              color={colors.primary}
              onPress={() => router.push('/(admin)/students')}
            />
            <StatCard
              icon="person-outline"
              value={teachers.length}
              label="Total Professeurs"
              color={colors.success}
              onPress={() => router.push('/(admin)/teachers')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="library-outline"
              value={classes.length}
              label="Total Classes"
              color={colors.accent}
              onPress={() => router.push('/(admin)/classes')}
            />
            <StatCard
              icon="book-outline"
              value={subjects.length}
              label="Total Matières"
              color={colors.warning}
              onPress={() => router.push('/(admin)/subjects')}
            />
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsCard}>
          {[
            { label: 'Ajouter un élève', icon: 'person-add-outline', route: '/(admin)/students', color: colors.primary },
            { label: 'Ajouter un professeur', icon: 'people-outline', route: '/(admin)/teachers', color: colors.success },
            { label: 'Ajouter une classe', icon: 'add-circle-outline', route: '/(admin)/classes', color: colors.accent },
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

        {/* Recent students */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Élèves récents</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/students')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentCard}>
          {recentStudents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Aucun élève enregistré</Text>
            </View>
          ) : (
            recentStudents.map((student) => (
              <RecentStudentItem key={student.id} student={student} classes={classes} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerLeft: {
    gap: spacing.xs,
  },
  greeting: {
    ...typography.h3,
    color: colors.text,
  },
  logoutBtn: {
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  seeAll: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  statsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
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
  actionLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  recentCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.captionBold,
    color: colors.text,
  },
  studentMeta: {
    ...typography.small,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
