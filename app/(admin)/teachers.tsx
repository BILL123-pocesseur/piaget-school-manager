import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTeachers, useCreateTeacher } from '@/hooks/useTeachers';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import type { User } from '@/types';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const DEFAULT_FORM: FormState = { firstName: '', lastName: '', email: '', password: '' };

export default function TeachersScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');

  const { data: teachers = [], isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Tous les champs sont obligatoires.');
      return;
    }
    setFormError('');
    try {
      await createTeacher.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
      });
      setModalVisible(false);
      setForm(DEFAULT_FORM);
    } catch (e: any) {
      setFormError(e?.message ?? 'Une erreur est survenue.');
    }
  };

  const renderTeacher = ({ item }: { item: User }) => {
    const initials = `${item.firstName?.[0] ?? ''}${item.lastName?.[0] ?? ''}`.toUpperCase();
    return (
      <View style={styles.teacherItem}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.teacherMeta}>{item.matricule ?? '—'}</Text>
          <Text style={styles.teacherEmail} numberOfLines={1}>{item.email}</Text>
        </View>
        <View style={[styles.activeBadge, { backgroundColor: item.isActive ? colors.successTint : colors.errorTint }]}>
          <Text style={[styles.activeText, { color: item.isActive ? colors.successDark : colors.errorDark }]}>
            {item.isActive ? 'Actif' : 'Inactif'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Professeurs</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setForm(DEFAULT_FORM); setFormError(''); setModalVisible(true); }}
          >
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.count}>{teachers.length} professeur{teachers.length !== 1 ? 's' : ''}</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={teachers}
            keyExtractor={(item) => item.id}
            renderItem={renderTeacher}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucun professeur</Text>
                <Text style={styles.emptyText}>Ajoutez un professeur en appuyant sur +</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={styles.flex}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau professeur</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.formFields}>
                <Input label="Prénom" value={form.firstName} onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))} />
                <Input label="Nom" value={form.lastName} onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))} />
                <Input
                  label="Email"
                  value={form.email}
                  onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Input
                  label="Mot de passe"
                  value={form.password}
                  onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                  secureTextEntry
                />

                {formError ? (
                  <View style={styles.formError}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                ) : null}

                <View style={styles.modalActions}>
                  <Button variant="outline" onPress={() => setModalVisible(false)}>Annuler</Button>
                  <Button variant="primary" onPress={handleSave} loading={createTeacher.isPending}>
                    Ajouter
                  </Button>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    ...typography.small,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  loader: { marginTop: spacing.xxl },
  listContent: { padding: spacing.sm, paddingBottom: spacing.xl },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.successTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...typography.captionBold, color: colors.successDark },
  teacherInfo: { flex: 1 },
  teacherName: { ...typography.captionBold, color: colors.text },
  teacherMeta: { ...typography.small, color: colors.textSecondary },
  teacherEmail: { ...typography.tiny, color: colors.textTertiary },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  activeText: { ...typography.tiny, fontWeight: '600' as const },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxxl, gap: spacing.sm },
  emptyTitle: { ...typography.h4, color: colors.textSecondary },
  emptyText: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  modalTitle: { ...typography.h4, color: colors.text },
  modalScroll: { flex: 1, backgroundColor: colors.backgroundSecondary },
  modalContent: { padding: spacing.md },
  formFields: { gap: spacing.md },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorTint,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  formErrorText: { ...typography.caption, color: colors.error, flex: 1 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
});
