import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import type { UserRole } from '@/types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

const roleConfig = {
  admin: { label: 'Administrateur', backgroundColor: colors.successTint, color: colors.successDark },
  teacher: { label: 'Professeur', backgroundColor: colors.primaryTint, color: colors.primaryDark },
  student: { label: 'Élève', backgroundColor: colors.warningTint, color: colors.warningDark },
};

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const config = roleConfig[role];
  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.text, { color: config.color }, size === 'sm' && styles.textSm]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  text: {
    ...typography.captionBold,
  },
  textSm: {
    ...typography.small,
    fontWeight: '600' as const,
  },
});
