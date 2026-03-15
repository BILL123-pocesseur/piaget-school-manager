import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useGrades, useCreateGrade, useUpdateGrade, useDeleteGrade, calculateAverage } from '@/hooks/useGrades';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { GradeItem } from '@/components/GradeItem';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import type { Grade, EvaluationType } from '@/types';

const CURRENT_YEAR = '2024-2025';
const COEFFICIENTS = [1, 2, 3, 4, 5, 6];
const SEMESTERS = [1, 2];

interface FormState {
  studentId: string;
  subjectId: string;
  gradeValue: string;
  coefficient: number;
  evaluationType: EvaluationType;
  semester: number;
}

const DEFAULT_FORM: FormState = {
  studentId: '',
  subjectId: '',
  gradeValue: '',
  coefficient: 2,
  evaluationType: 'devoir',
  semester: 1,
};

export default function TeacherGradesScreen() {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');

  const { data: grades = [], isLoading } = useGrades(selectedStudentId || undefined);
  const { data: classes = [] } = useClasses();
  const { data: students = [] } = useStudents(selectedClassId || undefined);
  const { data: subjects = [] } = useSubjects();
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();

  const studentGrades = useMemo(() =>
    selectedStudentId ? grades.filter((g) => g.studentId === selectedStudentId) : [],
    [grades, selectedStudentId]
  );

  const average = calculateAverage(studentGrades);

  const openAdd = () => {
    setForm({ ...DEFAULT_FORM, studentId: selectedStudentId });
    setFormError('');
    setEditingGrade(null);
    setModalVisible(true);
  };

  const openEdit = (grade: Grade) => {
    setForm({
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      gradeValue: String(grade.gradeValue),
      coefficient: grade.coefficient,
      evaluationType: grade.evaluationType,
      semester: grade.semester,
    });
    setFormError('');
    setEditingGrade(grade);
    setModalVisible(true);
  };

  const handleDelete = (grade: Grade) => {
    Alert.alert('Supprimer la note', 'Êtes-vous sûr de vouloir supprimer cette note ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteGrade.mutate(grade.id) },
    ]);
  };

  const handleSave = async () => {
    const val = parseFloat(form.gradeValue);
    if (!form.studentId || !form.subjectId) {
      setFormError('Sélectionnez un élève et une matière.');
      return;
    }
    if (isNaN(val) || val < 0 || val > 20) {
      setFormError('La note doit être entre 0 et 20.');
      return;
    }
    setFormError('');
    try {
      if (editingGrade) {
        await updateGrade.mutateAsync({
          id: editingGrade.id,
          data: {
            gradeValue: val,
            coefficient: form.coefficient,
            evaluationType: form.evaluationType,
            semester: form.semester,
          },
        });
      } else {
        await createGrade.mutateAsync({
          studentId: form.studentId,
          subjectId: form.subjectId,
          teacherId: user!.id,
          gradeValue: val,
          coefficient: form.coefficient,
          evaluationType: form.evaluationType,
          semester: form.semester,
          academicYear: CURRENT_YEAR,
        });
      }
      setModalVisible(false);
    } catch (e: any) {
      setFormError(e?.message ?? 'Une erreur est survenue.');
    }
  };

  const isSaving = createGrade.isPending || updateGrade.isPending;

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const getStudentName = (id: string) => {
    const s = students.find((st) => st.id === id);
    return s ? `${s.firstName} ${s.lastName}` : id;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Notes</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} disabled={!selectedStudentId}>
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Class selector */}
          <Text style={styles.sectionLabel}>Classe</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, !selectedClassId && styles.chipActive]}
              onPress={() => { setSelectedClassId(''); setSelectedStudentId(''); }}
            >
              <Text style={[styles.chipText, !selectedClassId && styles.chipTextActive]}>Toutes</Text>
            </TouchableOpacity>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[styles.chip, selectedClassId === cls.id && styles.chipActive]}
                onPress={() => { setSelectedClassId(cls.id); setSelectedStudentId(''); }}
              >
                <Text style={[styles.chipText, selectedClassId === cls.id && styles.chipTextActive]}>{cls.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Student selector */}
          <Text style={styles.sectionLabel}>Élève</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {students.length === 0 ? (
              <Text style={styles.hintText}>Sélectionnez une classe</Text>
            ) : (
              students.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, selectedStudentId === s.id && styles.chipActive]}
                  onPress={() => setSelectedStudentId(s.id)}
                >
                  <Text style={[styles.chipText, selectedStudentId === s.id && styles.chipTextActive]}>
                    {s.firstName} {s.lastName}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Average display */}
          {selectedStudentId && (
            <View style={styles.averageBox}>
              <Text style={styles.averageLabel}>Moyenne générale</Text>
              <Text style={[styles.averageValue, { color: average !== null && average >= 10 ? colors.success : colors.error }]}>
                {average !== null ? `${average}/20` : '—'}
              </Text>
            </View>
          )}

          {/* Grades list */}
          {selectedStudentId ? (
            isLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : studentGrades.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="create-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucune note</Text>
                <Text style={styles.emptyText}>Appuyez sur + pour saisir une note</Text>
              </View>
            ) : (
              <View style={styles.gradesList}>
                {studentGrades.map((grade) => (
                  <GradeItem
                    key={grade.id}
                    grade={grade}
                    subjectName={getSubjectName(grade.subjectId)}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            )
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Sélectionnez un élève pour voir ses notes</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={styles.flex}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingGrade ? 'Modifier la note' : 'Saisir une note'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.formFields}>
                {/* Student selector (in modal) */}
                {!editingGrade && (
                  <>
                    <View style={styles.pickerSection}>
                      <Text style={styles.pickerLabel}>Élève</Text>
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

                    <View style={styles.pickerSection}>
                      <Text style={styles.pickerLabel}>Matière</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {subjects.map((sub) => (
                          <TouchableOpacity
                            key={sub.id}
                            style={[styles.pickerOption, form.subjectId === sub.id && styles.pickerOptionActive]}
                            onPress={() => setForm((f) => ({ ...f, subjectId: sub.id, coefficient: sub.coefficient }))}
                          >
                            <Text style={[styles.pickerOptionText, form.subjectId === sub.id && styles.pickerOptionTextActive]}>
                              {sub.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}

                <Input
                  label="Note (0-20)"
                  value={form.gradeValue}
                  onChangeText={(v) => setForm((f) => ({ ...f, gradeValue: v }))}
                  keyboardType="decimal-pad"
                />

                {/* Type selector */}
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Type d'évaluation</Text>
                  <View style={styles.segmentedRow}>
                    {(['devoir', 'composition'] as EvaluationType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.segmentBtn, form.evaluationType === type && styles.segmentBtnActive]}
                        onPress={() => setForm((f) => ({ ...f, evaluationType: type }))}
                      >
                        <Text style={[styles.segmentText, form.evaluationType === type && styles.segmentTextActive]}>
                          {type === 'devoir' ? 'Devoir' : 'Composition'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Coefficient */}
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Coefficient</Text>
                  <View style={styles.coeffRow}>
                    {COEFFICIENTS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.coeffOption, form.coefficient === c && styles.coeffOptionActive]}
                        onPress={() => setForm((f) => ({ ...f, coefficient: c }))}
                      >
                        <Text style={[styles.coeffOptionText, form.coefficient === c && styles.coeffOptionTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Semester */}
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Semestre</Text>
                  <View style={styles.segmentedRow}>
                    {SEMESTERS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.segmentBtn, form.semester === s && styles.segmentBtnActive]}
                        onPress={() => setForm((f) => ({ ...f, semester: s }))}
                      >
                        <Text style={[styles.segmentText, form.semester === s && styles.segmentTextActive]}>
                          Semestre {s}
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
                  <Button variant="primary" onPress={handleSave} loading={isSaving}>
                    {editingGrade ? 'Enregistrer' : 'Saisir'}
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
    opacity: 1,
  },
  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  chipScroll: { marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' as const },
  hintText: { ...typography.caption, color: colors.textTertiary, marginVertical: spacing.xs },
  averageBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  averageLabel: { ...typography.bodyBold, color: colors.text },
  averageValue: { ...typography.h3 },
  gradesList: { gap: 0 },
  loader: { marginTop: spacing.xl },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
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
  segmentedRow: { flexDirection: 'row', borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  segmentBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.background },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { ...typography.captionBold, color: colors.textSecondary },
  segmentTextActive: { color: colors.white },
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
  coeffOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  coeffOptionText: { ...typography.bodyBold, color: colors.textSecondary },
  coeffOptionTextActive: { color: colors.primary },
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
