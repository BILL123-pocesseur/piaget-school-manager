import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import type { User } from '@/types';

type ModalMode = 'add' | 'edit';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  classId: string;
  password: string;
}

const DEFAULT_FORM: FormState = { firstName: '', lastName: '', email: '', classId: '', password: '' };

export default function StudentsScreen() {
  const [search, setSearch] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');

  const { data: students = [], isLoading } = useStudents(filterClassId || undefined);
  const { data: classes = [] } = useClasses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) =>
      `${s.firstName} ${s.lastName} ${s.matricule ?? ''}`.toLowerCase().includes(q)
    );
  }, [students, search]);

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setFormError('');
    setModalMode('add');
    setEditingId(null);
    setModalVisible(true);
  };

  const openEdit = (student: User) => {
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      classId: student.classId ?? '',
      password: '',
    });
    setFormError('');
    setModalMode('edit');
    setEditingId(student.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setFormError('Prénom, Nom et Email sont obligatoires.');
      return;
    }
    if (modalMode === 'add' && !form.password.trim()) {
      setFormError('Le mot de passe est obligatoire.');
      return;
    }
    setFormError('');
    try {
      if (modalMode === 'add') {
        await createStudent.mutateAsync({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          classId: form.classId || undefined,
          password: form.password.trim(),
        });
      } else if (editingId) {
        await updateStudent.mutateAsync({
          id: editingId,
          data: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            classId: form.classId || undefined,
            ...(form.password.trim() ? { passwordHash: form.password.trim() } : {}),
          },
        });
      }
      setModalVisible(false);
    } catch (e: any) {
      setFormError(e?.message ?? 'Une erreur est survenue.');
    }
  };

  const handleDelete = (student: User) => {
    Alert.alert(
      'Supprimer l\'élève',
      `Êtes-vous sûr de vouloir supprimer ${student.firstName} ${student.lastName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteStudent.mutate(student.id),
        },
      ]
    );
  };

  const renderStudent = ({ item }: { item: User }) => {
    const cls = classes.find((c) => c.id === item.classId);
    const initials = `${item.firstName?.[0] ?? ''}${item.lastName?.[0] ?? ''}`.toUpperCase();
    return (
      <View style={styles.studentItem}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.studentMeta}>{item.matricule ?? '—'} · {cls?.name ?? 'Sans classe'}</Text>
          <Text style={styles.studentEmail} numberOfLines={1}>{item.email}</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const isSaving = createStudent.isPending || updateStudent.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Élèves</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un élève..."
              clearable
            />
          </View>
        </View>

        {/* Class filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, !filterClassId && styles.filterChipActive]}
            onPress={() => setFilterClassId('')}
          >
            <Text style={[styles.filterChipText, !filterClassId && styles.filterChipTextActive]}>Toutes</Text>
          </TouchableOpacity>
          {classes.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={[styles.filterChip, filterClassId === cls.id && styles.filterChipActive]}
              onPress={() => setFilterClassId(cls.id)}
            >
              <Text style={[styles.filterChipText, filterClassId === cls.id && styles.filterChipTextActive]}>
                {cls.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Count */}
        <Text style={styles.count}>{filtered.length} élève{filtered.length !== 1 ? 's' : ''}</Text>

        {/* List */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderStudent}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucun élève trouvé</Text>
                <Text style={styles.emptyText}>Ajoutez un élève en appuyant sur le bouton +</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={styles.flex}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalMode === 'add' ? 'Ajouter un élève' : 'Modifier l\'élève'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.formFields}>
                <Input label="Prénom" value={form.firstName} onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))} />
                <Input label="Nom" value={form.lastName} onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))} />
                <Input label="Email" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} autoCapitalize="none" keyboardType="email-address" />
                <Input
                  label={modalMode === 'add' ? 'Mot de passe' : 'Nouveau mot de passe (optionnel)'}
                  value={form.password}
                  onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                  secureTextEntry
                />

                {/* Class picker */}
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Classe</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[styles.pickerOption, !form.classId && styles.pickerOptionActive]}
                      onPress={() => setForm((f) => ({ ...f, classId: '' }))}
                    >
                      <Text style={[styles.pickerOptionText, !form.classId && styles.pickerOptionTextActive]}>Aucune</Text>
                    </TouchableOpacity>
                    {classes.map((cls) => (
                      <TouchableOpacity
                        key={cls.id}
                        style={[styles.pickerOption, form.classId === cls.id && styles.pickerOptionActive]}
                        onPress={() => setForm((f) => ({ ...f, classId: cls.id }))}
                      >
                        <Text style={[styles.pickerOptionText, form.classId === cls.id && styles.pickerOptionTextActive]}>
                          {cls.name}
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
                  <Button variant="primary" onPress={handleSave} loading={isSaving}>
                    {modalMode === 'add' ? 'Ajouter' : 'Enregistrer'}
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
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.sm,
    top: '50%',
    zIndex: 1,
  },
  filterRow: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  filterChipText: { ...typography.caption, color: colors.textSecondary },
  filterChipTextActive: { color: colors.primary, fontWeight: '600' as const },
  count: {
    ...typography.small,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  loader: { marginTop: spacing.xxl },
  listContent: { padding: spacing.sm, paddingBottom: spacing.xl },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...typography.captionBold, color: colors.primary },
  studentInfo: { flex: 1 },
  studentName: { ...typography.captionBold, color: colors.text },
  studentMeta: { ...typography.small, color: colors.textSecondary },
  studentEmail: { ...typography.tiny, color: colors.textTertiary },
  itemActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { padding: spacing.xs },
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
  pickerOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  pickerOptionText: { ...typography.caption, color: colors.textSecondary },
  pickerOptionTextActive: { color: colors.primary, fontWeight: '600' as const },
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
