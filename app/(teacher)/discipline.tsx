import React, { useState, useMemo } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { useAttendance, useCreateAttendance } from '@/hooks/useAttendance';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { DisciplineItem } from '@/components/DisciplineItem';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import type { Attendance, AttendanceType } from '@/types';

const TABS: { key: AttendanceType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'absence', label: 'Absence' },
  { key: 'retard', label: 'Retard' },
  { key: 'punition', label: 'Punition' },
  { key: 'colle', label: 'Colle' },
];

interface FormState {
  studentId: string;
  type: AttendanceType;
  description: string;
  date: string;
  subjectId: string;
}

const TODAY = new Date().toISOString().split('T')[0];

export default function TeacherDisciplineScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AttendanceType | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>({
    studentId: '',
    type: 'absence',
    description: '',
    date: TODAY,
    subjectId: '',
  });
  const [formError, setFormError] = useState('');

  const { data: attendance = [], isLoading } = useAttendance();
  const { data: students = [] } = useStudents();
  const { data: subjects = [] } = useSubjects();
  const createAttendance = useCreateAttendance();

  const filtered = useMemo(() => {
    const records = attendance.filter((a) => a.teacherId === user?.id);
    if (activeTab === 'all') return records;
    return records.filter((a) => a.type === activeTab);
  }, [attendance, activeTab, user?.id]);

  const getStudentName = (id: string) => {
    const s = students.find((st) => st.id === id);
    return s ? `${s.firstName} ${s.lastName}` : '—';
  };
  const getSubjectName = (id?: string) => subjects.find((s) => s.id === id)?.name;

  const openModal = (defaultType?: AttendanceType) => {
    setForm({
      studentId: '',
      type: defaultType ?? (activeTab !== 'all' ? activeTab : 'absence'),
      description: '',
      date: TODAY,
      subjectId: '',
    });
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.studentId) {
      setFormError('Sélectionnez un élève.');
      return;
    }
    if (!form.date) {
      setFormError('La date est obligatoire.');
      return;
    }
    setFormError('');
    try {
      await createAttendance.mutateAsync({
        studentId: form.studentId,
        teacherId: user!.id,
        type: form.type,
        description: form.description || undefined,
        date: form.date,
        subjectId: form.subjectId || undefined,
      });
      setModalVisible(false);
    } catch (e: any) {
      setFormError(e?.message ?? 'Une erreur est survenue.');
    }
  };

  const tabColors: Record<string, string> = {
    all: colors.primary,
    absence: colors.error,
    retard: colors.warning,
    punition: colors.accent,
    colle: colors.secondary,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Discipline</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
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
                studentName={getStudentName(item.studentId)}
                subjectName={item.subjectId ? getSubjectName(item.subjectId) : undefined}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucun enregistrement</Text>
                <Text style={styles.emptyText}>Appuyez sur + pour enregistrer</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={styles.flex}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enregistrer</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.formFields}>
                {/* Student */}
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Élève *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {students.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.pickerOption, form.studentId === s.id && styles.pickerOptionActive]}
                        onPress={() => setForm((f) => ({ ...f, studentId: s.id }))}
                      >
                        <Text style={[styles.pickerOptionText, form.studentId === s.id && styles.pickerOptionTextActive]}>
                          {s.firstName} {s.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Type */}
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Type</Text>
                  <View style={styles.typeGrid}>
                    {(['absence', 'retard', 'punition', 'colle'] as AttendanceType[]).map((type) => {
                      const isSelected = form.type === type;
                      const tColor = tabColors[type];
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[styles.typeOption, isSelected && { borderColor: tColor, backgroundColor: tColor + '15' }]}
                          onPress={() => setForm((f) => ({ ...f, type }))}
                        >
                          <Text style={[styles.typeOptionText, isSelected && { color: tColor, fontWeight: '700' as const }]}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Date */}
                <Input
                  label="Date (AAAA-MM-JJ)"
                  value={form.date}
                  onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                  placeholder="2024-01-15"
                />

                {/* Description */}
                <Input
                  label="Description (optionnel)"
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  multiline
                  numberOfLines={3}
                />

                {/* Subject (optional) */}
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Matière (optionnel)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[styles.pickerOption, !form.subjectId && styles.pickerOptionActive]}
                      onPress={() => setForm((f) => ({ ...f, subjectId: '' }))}
                    >
                      <Text style={[styles.pickerOptionText, !form.subjectId && styles.pickerOptionTextActive]}>Aucune</Text>
                    </TouchableOpacity>
                    {subjects.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={[styles.pickerOption, form.subjectId === sub.id && styles.pickerOptionActive]}
                        onPress={() => setForm((f) => ({ ...f, subjectId: sub.id }))}
                      >
                        <Text style={[styles.pickerOptionText, form.subjectId === sub.id && styles.pickerOptionTextActive]}>
                          {sub.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {formError ? (
                  <View style={styles.formError}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                ) : null}

                <View style={styles.modalActions}>
                  <Button variant="outline" onPress={() => setModalVisible(false)}>Annuler</Button>
                  <Button variant="primary" onPress={handleSave} loading={createAttendance.isPending}>
                    Enregistrer
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
  // Modal
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
  pickerSection: { gap: spacing.xs },
  pickerLabel: { ...typography.captionBold, color: colors.textSecondary },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: spacing.xs,
  },
  pickerOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  pickerOptionText: { ...typography.caption, color: colors.textSecondary },
  pickerOptionTextActive: { color: colors.primary, fontWeight: '600' as const },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeOptionText: { ...typography.captionBold, color: colors.textSecondary },
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
