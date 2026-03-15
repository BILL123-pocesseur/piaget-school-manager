import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { useSubjects } from '@/hooks/useSubjects';
import { DisciplineItem } from '@/components/DisciplineItem';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import type { AttendanceType } from '@/types';

const TABS: { key: AttendanceType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'absence', label: 'Absences' },
  { key: 'retard', label: 'Retards' },
  { key: 'punition', label: 'Punitions' },
  { key: 'colle', label: 'Colles' },
];

const tabColors: Record<string, string> = {
  all: colors.primary,
  absence: colors.error,
  retard: colors.warning,
  punition: colors.accent,
  colle: colors.secondary,
};

export default function StudentDisciplineScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AttendanceType | 'all'>('all');

  const { data: attendance = [], isLoading } = useAttendance(user?.id);
  const { data: subjects = [] } = useSubjects();

  const filtered = useMemo(() => {
    if (activeTab === 'all') return attendance;
    return attendance.filter((a) => a.type === activeTab);
  }, [attendance, activeTab]);

  const counts = useMemo(() => ({
    absence: attendance.filter((a) => a.type === 'absence').length,
    retard: attendance.filter((a) => a.type === 'retard').length,
    punition: attendance.filter((a) => a.type === 'punition').length,
    colle: attendance.filter((a) => a.type === 'colle').length,
  }), [attendance]);

  const getSubjectName = (id?: string) => subjects.find((s) => s.id === id)?.name;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Conduite</Text>
        </View>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          {(['absence', 'retard', 'punition', 'colle'] as AttendanceType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.summaryCard, { borderColor: tabColors[type] + '40' }]}
              onPress={() => setActiveTab(type)}
              activeOpacity={0.7}
            >
              <Text style={[styles.summaryValue, { color: tabColors[type] }]}>{counts[type]}</Text>
              <Text style={styles.summaryLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const tabColor = tabColors[tab.key] ?? colors.primary;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && { backgroundColor: tabColor + '15', borderColor: tabColor }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && { color: tabColor, fontWeight: '700' as const }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DisciplineItem
                record={item}
                subjectName={item.subjectId ? getSubjectName(item.subjectId) : undefined}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Aucun enregistrement</Text>
                <Text style={styles.emptyText}>Aucune {activeTab === 'all' ? 'entrée' : activeTab} enregistrée</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundSecondary },
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.text },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  summaryValue: { ...typography.h4 },
  summaryLabel: { ...typography.tiny, color: colors.textSecondary, marginTop: 2 },
  tabScroll: { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabContent: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.xs },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundTertiary,
    marginRight: spacing.xs,
  },
  tabText: { ...typography.caption, color: colors.textSecondary },
  loader: { marginTop: spacing.xxl },
  listContent: { padding: spacing.sm, paddingBottom: spacing.xl },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxxl, gap: spacing.sm },
  emptyTitle: { ...typography.h4, color: colors.textSecondary },
  emptyText: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
});
