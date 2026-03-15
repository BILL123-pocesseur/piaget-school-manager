import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import type { Grade } from '@/types';

interface GradeItemProps {
  grade: Grade;
  subjectName?: string;
  studentName?: string;
  onEdit?: (grade: Grade) => void;
  onDelete?: (grade: Grade) => void;
  showStudent?: boolean;
}

function gradeColor(value: number): string {
  if (value >= 16) return colors.success;
  if (value >= 12) return colors.primary;
  if (value >= 10) return colors.warning;
  return colors.error;
}

export function GradeItem({ grade, subjectName, studentName, onEdit, onDelete, showStudent }: GradeItemProps) {
  const gColor = gradeColor(grade.gradeValue);
  const typeLabel = grade.evaluationType === 'devoir' ? 'Devoir' : 'Compo';
  const typeColor = grade.evaluationType === 'devoir' ? colors.primary : colors.accent;
  const dateStr = grade.createdAt ? new Date(grade.createdAt).toLocaleDateString('fr-FR') : '';

  return (
    <View style={styles.container}>
      <View style={[styles.gradeBox, { backgroundColor: gColor + '15', borderColor: gColor }]}>
        <Text style={[styles.gradeValue, { color: gColor }]}>{grade.gradeValue}</Text>
        <Text style={[styles.gradeMax, { color: gColor + 'AA' }]}>/20</Text>
      </View>
      <View style={styles.info}>
        {showStudent && studentName && (
          <Text style={styles.studentName} numberOfLines={1}>{studentName}</Text>
        )}
        {subjectName && (
          <Text style={styles.subject} numberOfLines={1}>{subjectName}</Text>
        )}
        <View style={styles.row}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
          </View>
          <Text style={styles.coeff}>Coeff. {grade.coefficient}</Text>
          <Text style={styles.semester}>S{grade.semester}</Text>
        </View>
        {dateStr ? <Text style={styles.date}>{dateStr}</Text> : null}
      </View>
      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit(grade)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="pencil-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(grade)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradeBox: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  gradeValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 22,
  },
  gradeMax: {
    fontSize: 10,
    fontWeight: '500' as const,
  },
  info: {
    flex: 1,
  },
  studentName: {
    ...typography.captionBold,
    color: colors.text,
    marginBottom: 2,
  },
  subject: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    ...typography.tiny,
    fontWeight: '600' as const,
  },
  coeff: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  semester: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  date: {
    ...typography.tiny,
    color: colors.textTertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
  },
});
