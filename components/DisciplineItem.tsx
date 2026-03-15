import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import type { Attendance, AttendanceType } from '@/types';

interface DisciplineItemProps {
  record: Attendance;
  studentName?: string;
  subjectName?: string;
}

const typeConfig: Record<AttendanceType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  absence: { label: 'Absence', icon: 'close-circle-outline', color: colors.error },
  retard: { label: 'Retard', icon: 'time-outline', color: colors.warning },
  punition: { label: 'Punition', icon: 'warning-outline', color: colors.accent },
  colle: { label: 'Colle', icon: 'school-outline', color: colors.secondary },
};

export function DisciplineItem({ record, studentName, subjectName }: DisciplineItemProps) {
  const config = typeConfig[record.type] ?? typeConfig.absence;
  const dateStr = record.date ? new Date(record.date).toLocaleDateString('fr-FR') : '';

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
          {studentName && (
            <Text style={styles.studentName} numberOfLines={1}>{studentName}</Text>
          )}
        </View>
        {record.description ? (
          <Text style={styles.description} numberOfLines={2}>{record.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          {subjectName && (
            <Text style={styles.meta}>{subjectName} · </Text>
          )}
          {dateStr ? <Text style={styles.meta}>{dateStr}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  info: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.tiny,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  studentName: {
    ...typography.captionBold,
    color: colors.text,
    flex: 1,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    ...typography.tiny,
    color: colors.textTertiary,
  },
});
