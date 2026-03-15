import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useGrades, calculateAverage } from '@/hooks/useGrades';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { useClasses } from '@/hooks/useClasses';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import type { Grade } from '@/types';

function getMention(avg: number | null): { label: string; color: string } {
  if (avg === null) return { label: '—', color: colors.textSecondary };
  if (avg >= 16) return { label: 'Excellent', color: colors.success };
  if (avg >= 14) return { label: 'Très Bien', color: colors.success };
  if (avg >= 12) return { label: 'Bien', color: colors.primary };
  if (avg >= 10) return { label: 'Assez Bien', color: colors.warning };
  return { label: 'Insuffisant', color: colors.error };
}

export default function BulletinScreen() {
  const { user } = useAuth();
  const [semester, setSemester] = useState<1 | 2>(1);

  const { data: myGrades = [], isLoading: gradesLoading } = useGrades(user?.id);
  const { data: allStudents = [] } = useStudents(user?.classId);
  const { data: subjects = [] } = useSubjects();
  const { data: classes = [] } = useClasses();
  const { data: allGrades = [] } = useGrades();

  const myClass = classes.find((c) => c.id === user?.classId);

  const semGrades = useMemo(
    () => myGrades.filter((g) => g.semester === semester),
    [myGrades, semester]
  );

  // Build subject rows
  interface SubjectRow {
    name: string;
    coefficient: number;
    grades: Grade[];
    average: number | null;
    weightedAvg: number | null;
  }

  const subjectRows: SubjectRow[] = useMemo(() => {
    return subjects.map((sub) => {
      const sg = semGrades.filter((g) => g.subjectId === sub.id);
      const avg = calculateAverage(sg);
      return {
        name: sub.name,
        coefficient: sub.coefficient,
        grades: sg,
        average: avg,
        weightedAvg: avg !== null ? Math.round(avg * sub.coefficient * 100) / 100 : null,
      };
    }).filter((r) => r.grades.length > 0);
  }, [subjects, semGrades]);

  const overallAverage = calculateAverage(semGrades);
  const mention = getMention(overallAverage);

  // Calculate rank among classmates
  const rank = useMemo(() => {
    if (!user?.classId || allStudents.length === 0) return null;
    const classAverages = allStudents.map((s) => {
      const sg = allGrades.filter((g) => g.studentId === s.id && g.semester === semester);
      return { id: s.id, average: calculateAverage(sg) };
    });
    classAverages.sort((a, b) => {
      if (a.average === null && b.average === null) return 0;
      if (a.average === null) return 1;
      if (b.average === null) return -1;
      return b.average - a.average;
    });
    const myRank = classAverages.findIndex((ca) => ca.id === user.id) + 1;
    return myRank > 0 ? `${myRank}/${classAverages.length}` : null;
  }, [allStudents, allGrades, semester, user]);

  const totalWeightedAvg = useMemo(() => {
    const valid = subjectRows.filter((r) => r.weightedAvg !== null);
    if (valid.length === 0) return null;
    const totalCoeff = valid.reduce((s, r) => s + r.coefficient, 0);
    const totalWeighted = valid.reduce((s, r) => s + (r.weightedAvg ?? 0), 0);
    return totalCoeff > 0 ? Math.round((totalWeighted / totalCoeff) * 100) / 100 : null;
  }, [subjectRows]);

  const handleDownload = () => {
    Alert.alert('Téléchargement PDF', 'Fonctionnalité bientôt disponible.');
  };

  const isLoading = gradesLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bulletin Scolaire</Text>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
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
            {/* School header */}
            <View style={styles.schoolHeader}>
              <View style={styles.schoolIconBox}>
                <Ionicons name="school" size={28} color={colors.white} />
              </View>
              <View>
                <Text style={styles.schoolName}>LYCÉE JEAN PIAGET</Text>
                <Text style={styles.schoolSubtitle}>Bulletin de Notes · Semestre {semester}</Text>
              </View>
            </View>

            {/* Student info */}
            <View style={styles.studentInfo}>
              <View style={styles.studentInfoRow}>
                <Text style={styles.infoLabel}>Nom complet:</Text>
                <Text style={styles.infoValue}>{user?.firstName} {user?.lastName}</Text>
              </View>
              <View style={styles.studentInfoRow}>
                <Text style={styles.infoLabel}>Matricule:</Text>
                <Text style={styles.infoValue}>{user?.matricule ?? '—'}</Text>
              </View>
              <View style={styles.studentInfoRow}>
                <Text style={styles.infoLabel}>Classe:</Text>
                <Text style={styles.infoValue}>{myClass?.name ?? '—'}</Text>
              </View>
              {rank && (
                <View style={styles.studentInfoRow}>
                  <Text style={styles.infoLabel}>Rang:</Text>
                  <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '700' as const }]}>{rank}</Text>
                </View>
              )}
            </View>

            {/* Grades table */}
            {subjectRows.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucune note disponible</Text>
                <Text style={styles.emptyText}>Le bulletin sera disponible lorsque vous aurez des notes pour le semestre {semester}</Text>
              </View>
            ) : (
              <View style={styles.tableCard}>
                {/* Table header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, styles.tableCellSubject, styles.tableHeaderText]}>Matière</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall, styles.tableHeaderText]}>Moy.</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall, styles.tableHeaderText]}>Coeff</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall, styles.tableHeaderText]}>Pond.</Text>
                </View>

                {subjectRows.map((row, idx) => (
                  <View key={row.name} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven]}>
                    <Text style={[styles.tableCell, styles.tableCellSubject]} numberOfLines={1}>{row.name}</Text>
                    <View style={[styles.tableCell, styles.tableCellSmall, styles.tableCellCenter]}>
                      {row.average !== null ? (
                        <View style={[styles.avgPill, { backgroundColor: getMention(row.average).color + '20' }]}>
                          <Text style={[styles.avgPillText, { color: getMention(row.average).color }]}>
                            {row.average}
                          </Text>
                        </View>
                      ) : <Text style={styles.tableCellText}>—</Text>}
                    </View>
                    <Text style={[styles.tableCell, styles.tableCellSmall, styles.tableCellText, styles.tableCellCenter]}>{row.coefficient}</Text>
                    <Text style={[styles.tableCell, styles.tableCellSmall, styles.tableCellText, styles.tableCellCenter]}>
                      {row.weightedAvg !== null ? row.weightedAvg : '—'}
                    </Text>
                  </View>
                ))}

                {/* Totals row */}
                <View style={[styles.tableRow, styles.tableTotalRow]}>
                  <Text style={[styles.tableCell, styles.tableCellSubject, styles.tableTotalText]}>Moyenne Générale</Text>
                  <View style={[styles.tableCell, styles.tableCellSmall, styles.tableCellCenter]}>
                    <Text style={[styles.tableTotalValue, { color: mention.color }]}>
                      {overallAverage ?? '—'}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, styles.tableCellSmall, styles.tableCellCenter]}>—</Text>
                  <Text style={[styles.tableCell, styles.tableCellSmall, styles.tableCellCenter]}>—</Text>
                </View>
              </View>
            )}

            {/* Mention & rank summary */}
            {overallAverage !== null && (
              <View style={[styles.mentionCard, { borderColor: mention.color + '40', backgroundColor: mention.color + '10' }]}>
                <View style={styles.mentionRow}>
                  <Text style={styles.mentionLabel}>Mention:</Text>
                  <Text style={[styles.mentionValue, { color: mention.color }]}>{mention.label}</Text>
                </View>
                {rank && (
                  <View style={styles.mentionRow}>
                    <Text style={styles.mentionLabel}>Classement:</Text>
                    <Text style={[styles.mentionValue, { color: colors.primary }]}>{rank} de la classe</Text>
                  </View>
                )}
              </View>
            )}

            {/* Download button */}
            <TouchableOpacity style={styles.pdfBtn} onPress={handleDownload} activeOpacity={0.8}>
              <Ionicons name="download-outline" size={20} color={colors.white} />
              <Text style={styles.pdfBtnText}>Télécharger PDF</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.text },
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  semesterToggle: {
    flexDirection: 'row',
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  semesterBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.background },
  semesterBtnActive: { backgroundColor: colors.primary },
  semesterBtnText: { ...typography.captionBold, color: colors.textSecondary },
  semesterBtnTextActive: { color: colors.white },
  loader: { marginTop: spacing.xxl },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  schoolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  schoolIconBox: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolName: {
    ...typography.h4,
    color: colors.white,
    letterSpacing: 1,
  },
  schoolSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  studentInfo: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  studentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: { ...typography.caption, color: colors.textSecondary },
  infoValue: { ...typography.captionBold, color: colors.text },
  tableCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.xs,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowEven: { backgroundColor: colors.backgroundSecondary },
  tableHeader: { backgroundColor: colors.primary },
  tableTotalRow: { backgroundColor: colors.primaryTint },
  tableCell: {
    padding: spacing.sm,
  },
  tableCellSubject: { flex: 2 },
  tableCellSmall: { flex: 1 },
  tableCellCenter: { textAlign: 'center', alignItems: 'center', justifyContent: 'center' },
  tableCellText: { ...typography.caption, color: colors.text, textAlign: 'center' },
  tableHeaderText: { ...typography.captionBold, color: colors.white },
  tableTotalText: { ...typography.captionBold, color: colors.primaryDark },
  tableTotalValue: { fontSize: 16, fontWeight: '700' as const },
  avgPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  avgPillText: { ...typography.captionBold },
  mentionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  mentionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mentionLabel: { ...typography.captionBold, color: colors.textSecondary },
  mentionValue: { ...typography.h4 },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  pdfBtnText: { ...typography.bodyBold, color: colors.white },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
  emptyTitle: { ...typography.h4, color: colors.textSecondary },
  emptyText: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
});
