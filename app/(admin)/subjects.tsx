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
import { useSubjects, useCreateSubject } from '@/hooks/useSubjects';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import type { Subject } from '@/types';

const COEFFICIENTS = [1, 2, 3, 4, 5, 6];

interface FormState {
  name: string;
  coefficient: number;
}

const DEFAULT_FORM: FormState = { name: '', coefficient: 2 };

export default function SubjectsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');

  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Le nom de la matière est obligatoire.');
      return;
    }
    setFormError('');
    try {
      await createSubject.mutateAsync({
        name: form.name.trim(),
        coefficient: form.coefficient,
      });
      setModalVisible(false);
      setForm(DEFAULT_FORM);
    } catch (e: any) {
      setFormError(e?.message ?? 'Une erreur est survenue.');
    }
  };

  const coeffColor = (c: number) => {
    if (c >= 5) return colors.error;
    if (c >= 3) return colors.warning;
    return colors.primary;
  };

  const renderSubject = ({ item }: { item: Subject }) => (
    <View style={styles.subjectItem}>
      <View style={styles.subjectIconBox}>
        <Ionicons name="book-outline" size={20} color={colors.warning} />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{item.name}</Text>
      </View>
      <View style={[styles.coeffBadge, { backgroundColor: coeffColor(item.coefficient) + '20' }]}>
        <Text style={[styles.coeffText, { color: coeffColor(item.coefficient) }]}>Coeff. {item.coefficient}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Matières</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setForm(DEFAULT_FORM); setFormError(''); setModalVisible(true); }}
          >
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.count}>{subjects.length} matière{subjects.length !== 1 ? 's' : ''}</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.id}
            renderItem={renderSubject}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucune matière</Text>
                <Text style={styles.emptyText}>Ajoutez une matière en appuyant sur +</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={styles.flex}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle matière</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.formFields}>
                <Input
                  label="Nom de la matière (ex: Mathématiques)"
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />

                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Coefficient</Text>
                  <View style={styles.coeffRow}>
                    {COEFFICIENTS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.coeffOption,
                          form.coefficient === c && { borderColor: coeffColor(c), backgroundColor: coeffColor(c) + '15' },
                        ]}
                        onPress={() => setForm((f) => ({ ...f, coefficient: c }))}
                      >
                        <Text style={[
                          styles.coeffOptionText,
                          form.coefficient === c && { color: coeffColor(c), fontWeight: '700' as const },
                        ]}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {formError ? (
                  <View style={styles.formError}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                ) : null}

                <View style={styles.modalActions}>
                  <Button variant="outline" onPress={() => setModalVisible(false)}>Annuler</Button>
                  <Button variant="primary" onPress={handleSave} loading={createSubject.isPending}>
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
  subjectItem: {
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
  subjectIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warningTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInfo: { flex: 1 },
  subjectName: { ...typography.bodyBold, color: colors.text },
  coeffBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  coeffText: { ...typography.captionBold },
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
  pickerSection: { gap: spacing.sm },
  pickerLabel: { ...typography.captionBold, color: colors.textSecondary },
  coeffRow: { flexDirection: 'row', gap: spacing.sm },
  coeffOption: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  coeffOptionText: { ...typography.bodyBold, color: colors.textSecondary },
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
