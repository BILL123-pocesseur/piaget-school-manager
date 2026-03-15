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
import { useClasses, useCreateClass } from '@/hooks/useClasses';
import { useStudents } from '@/hooks/useStudents';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import type { Class } from '@/types';

const LEVELS = ['Sixième', 'Cinquième', 'Quatrième', 'Troisième', 'Seconde', 'Première', 'Terminale'];
const CURRENT_YEAR = '2024-2025';

interface FormState {
  name: string;
  level: string;
  academicYear: string;
}

const DEFAULT_FORM: FormState = { name: '', level: LEVELS[4], academicYear: CURRENT_YEAR };

export default function ClassesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');

  const { data: classes = [], isLoading } = useClasses();
  const { data: students = [] } = useStudents();
  const createClass = useCreateClass();

  const getStudentCount = (classId: string) =>
    students.filter((s) => s.classId === classId).length;

  const handleSave = async () => {
    if (!form.name.trim() || !form.level.trim()) {
      setFormError('Nom et niveau sont obligatoires.');
      return;
    }
    setFormError('');
    try {
      await createClass.mutateAsync({
        name: form.name.trim(),
        level: form.level,
        academicYear: form.academicYear || CURRENT_YEAR,
      });
      setModalVisible(false);
      setForm(DEFAULT_FORM);
    } catch (e: any) {
      setFormError(e?.message ?? 'Une erreur est survenue.');
    }
  };

  const renderClass = ({ item }: { item: Class }) => {
    const count = getStudentCount(item.id);
    return (
      <View style={styles.classItem}>
        <View style={styles.classIconBox}>
          <Ionicons name="library-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.classInfo}>
          <Text style={styles.className}>{item.name}</Text>
          <Text style={styles.classMeta}>{item.level} · {item.academicYear}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
          <Text style={styles.countLabel}>élève{count !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Classes</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setForm(DEFAULT_FORM); setFormError(''); setModalVisible(true); }}
          >
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id}
            renderItem={renderClass}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="library-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucune classe</Text>
                <Text style={styles.emptyText}>Ajoutez une classe en appuyant sur +</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={styles.flex}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle classe</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.formFields}>
                <Input
                  label="Nom de la classe (ex: 3ème A)"
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
                <Input
                  label="Année académique (ex: 2024-2025)"
                  value={form.academicYear}
                  onChangeText={(v) => setForm((f) => ({ ...f, academicYear: v }))}
                />

                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Niveau</Text>
                  <View style={styles.levelGrid}>
                    {LEVELS.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.levelOption, form.level === level && styles.levelOptionActive]}
                        onPress={() => setForm((f) => ({ ...f, level }))}
                      >
                        <Text style={[styles.levelOptionText, form.level === level && styles.levelOptionTextActive]}>
                          {level}
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
                  <Button variant="primary" onPress={handleSave} loading={createClass.isPending}>
                    Créer
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
  loader: { marginTop: spacing.xxl },
  listContent: { padding: spacing.sm, paddingBottom: spacing.xl },
  classItem: {
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
  classIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: { flex: 1 },
  className: { ...typography.bodyBold, color: colors.text },
  classMeta: { ...typography.small, color: colors.textSecondary },
  countBadge: {
    alignItems: 'center',
    minWidth: 48,
  },
  countText: { ...typography.h3, color: colors.primary },
  countLabel: { ...typography.tiny, color: colors.textSecondary },
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
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  levelOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  levelOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  levelOptionText: { ...typography.caption, color: colors.textSecondary },
  levelOptionTextActive: { color: colors.primary, fontWeight: '600' as const },
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
