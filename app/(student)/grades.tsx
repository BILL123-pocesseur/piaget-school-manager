import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useGrades, calculateAverage } from '@/hooks/useGrades';
import { useSubjects } from '@/hooks/useSubjects';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import type { Grade } from '@/types';

function gradeColor(value: number): string {
  if (value >= 16) return colors.success;
  if (value >= 12) return colors.primary;
  if (value >= 10) return colors.warning;
  return colors.error;
}

function GradeRow({ grade }: { grade: Grade }) {
  const color = gradeColor(grade.gradeValue);
  const typeLabel = grade.evaluationType === 'devoir' ? 'D' : 'C';
  const date = grade.createdAt ? new Date(grade.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '';
  return (
    <View style={styles.gradeRow}>
      <View style={[styles.typeTag, { backgroundColor: grade.evaluationType === 'devoir' ? colors.primaryTint : colors.accentTint }]}>
        <Text style={[styles.typeTagText, { color: grade.evaluationType === 'devoir' ? colors.primary : colors.accent }]}>{typeLabel}</Text>
      </View>
      <Text style={styles.gradeDate}>{date}</Text>
      <Text style={styles.gradeCoeff}>×{grade.coefficient}</Text>
      <View style={[styles.gradeValueBox, { backgroundColor: color + '15' }]}>
        <Text style={[styles.gradeValueText, { color }]}>{grade.gradeValue}</Text>
      </View>
    </View>
  );
}

export default function StudentGradesScreen() {
  const { user } = useAuth();
  const [semester, setSemester] = useState<1 | 2>(1);

  const { data: allGrades = [], isLoading } = useGrades(user?.id);
  const { data: subjects = [] } = useSubjects();

  const semesterGrades = useMemo(
    () => allGrades.filter((g) => g.semester === semester),
    [allGrades, semester]
  );

  // Group by subject
  const groupedBySubject = useMemo(() => {
    const map = new Map<string, Grade[]>();
    semesterGrades.forEach((g) => {
      const existing = map.get(g.subjectId) ?? [];
      map.set(g.subjectId, [...existing, g]);
    });
    return map;
  }, [semesterGrades]);

  const overallAverage = calculateAverage(semesterGrades);

  const subjectAverages = useMemo(() => {
    const avgs: Array<{ subject: (typeof subjects)[0]; grades: Grade[]; average: number | null }> = [];
    groupedBySubject.forEach((gradeList, subjectId) => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (subject) {
        avgs.push({ subject, grades: gradeList, average: calculateAverage(gradeList) });
      }
    });
    return avgs.sort((a, b) => a.subject.name.localeCompare(b.subject.name));
  }, [groupedBySubject, subjects]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes Notes</Text>
        </View>

        {/* Semester toggle */}
        <View style={styles.semesterToggle}>
          {([1, 2] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.semesterBtn, semester === s && styles.semesterBtnActive]}
              onPress={() => setSemester(s)}
            >
              <Text style={[styles.semesterBtnText, semester === s && styles.semesterBtnTextActive]}>
                Semestre {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {subjectAverages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bar-chart-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucune note</Text>
                <Text style={styles.emptyText}>Aucune note pour le semestre {semester}</Text>
              </View>
            ) : (
              <>
                {subjectAverages.map(({ subject, grades, average }) => (
                  <View key={subject.id} style={styles.subjectBlock}>
                    <View style={styles.subjectHeader}>
                      <View style={styles.subjectHeaderLeft}>
                        <Text style={styles.subjectName}>{subject.name}</Text>
                        <View style={styles.coeffBadge}>
                          <Text style={styles.coeffText}>Coeff. {subject.coefficient}</Text>
                        </View>
                      </View>
                      {average !== null && (
                        <View style={[styles.subjectAvgBox, { backgroundColor: gradeColor(average) + '15' }]}>
                          <Text style={[styles.subjectAvg, { color: gradeColor(average) }]}>
                            {average}/20
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.gradesContainer}>
                      {grades.map((g) => (
                        <GradeRow key={g.id} grade={g} />
                      ))}
                    </View>
                  </View>
                ))}

                {/* Overall average */}
                <View style={styles.overallBox}>
                  <Text style={styles.overallLabel}>Moyenne générale · Semestre {semester}</Text>
                  <Text style={[styles.overallValue, { color: overallAverage !== null ? gradeColor(overallAverage) : colors.textSecondary }]}>
                    {overallAverage !== null ? `${overallAverage}/20` : '—'}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
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
  semesterToggle: {
    flexDirection: 'row',
    margin: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  semesterBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  semesterBtnActive: { backgroundColor: colors.primary },
  semesterBtnText: { ...typography.captionBold, color: colors.textSecondary },
  semesterBtnTextActive: { color: colors.white },
  loader: { marginTop: spacing.xxl },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  subjectBlock: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.xs,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  subjectHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  subjectName: { ...typography.bodyBold, color: colors.text },
  coeffBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  coeffText: { ...typography.tiny, color: colors.primary, fontWeight: '600' as const },
  subjectAvgBox: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  subjectAvg: { ...typography.captionBold },
  gradesContainer: { padding: spacing.sm },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  typeTag: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeTagText: { ...typography.tiny, fontWeight: '700' as const },
  gradeDate: { ...typography.small, color: colors.textSecondary, flex: 1 },
  gradeCoeff: { ...typography.small, color: colors.textTertiary },
  gradeValueBox: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 44,
    alignItems: 'center',
  },
  gradeValueText: { ...typography.captionBold },
  overallBox: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  overallLabel: { ...typography.bodyBold, color: 'rgba(255,255,255,0.9)' },
  overallValue: { fontSize: 28, fontWeight: '700' as const, color: colors.white },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxxl, gap: spacing.sm },
  emptyTitle: { ...typography.h4, color: colors.textSecondary },
  emptyText: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
});
