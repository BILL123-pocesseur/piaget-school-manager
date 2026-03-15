import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { generateId } from '@/lib/id';
import type { Grade, CreateGradeInput, UpdateGradeInput } from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const gradeKeys = {
  all: ['grades'] as const,
  list: (studentId?: string, subjectId?: string) =>
    ['grades', 'list', studentId ?? 'all', subjectId ?? 'all'] as const,
  byStudent: (studentId: string) =>
    ['grades', 'student', studentId] as const,
  detail: (id: string) => ['grades', 'detail', id] as const,
};

// ─── List (with optional filters) ────────────────────────────────────────────

export function useGrades(studentId?: string, subjectId?: string) {
  return useQuery({
    queryKey: gradeKeys.list(studentId, subjectId),
    queryFn: async (): Promise<Grade[]> => {
      // Use single-field where to avoid AND issues, filter rest client-side
      const where = studentId
        ? { studentId }
        : subjectId
        ? { subjectId }
        : undefined;

      const result = await blink.db.grades.list({
        where,
        orderBy: { createdAt: 'desc' },
      });

      let grades = result as Grade[];

      // Apply secondary filter client-side
      if (studentId && subjectId) {
        grades = grades.filter((g) => g.subjectId === subjectId);
      }

      return grades;
    },
  });
}

// ─── By Student ───────────────────────────────────────────────────────────────

export function useGradesByStudent(studentId: string) {
  return useQuery({
    queryKey: gradeKeys.byStudent(studentId),
    queryFn: async (): Promise<Grade[]> => {
      const result = await blink.db.grades.list({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      });
      return result as Grade[];
    },
    enabled: Boolean(studentId),
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGradeInput): Promise<Grade> => {
      const newGrade = await blink.db.grades.create({
        id: generateId(),
        studentId: data.studentId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        gradeValue: data.gradeValue,
        coefficient: data.coefficient ?? 1,
        evaluationType: data.evaluationType,
        semester: data.semester ?? 1,
        academicYear: data.academicYear,
        createdAt: new Date().toISOString(),
      });

      return newGrade as Grade;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
      queryClient.invalidateQueries({
        queryKey: gradeKeys.byStudent(variables.studentId),
      });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateGradeInput;
    }): Promise<Grade> => {
      const updated = await blink.db.grades.update(id, data);
      return updated as Grade;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
      queryClient.invalidateQueries({ queryKey: gradeKeys.detail(id) });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await blink.db.grades.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
    },
  });
}

// ─── Utility: Weighted Average ────────────────────────────────────────────────

/**
 * Calculates the weighted average of a list of grades by coefficient.
 * Returns null if the grades array is empty.
 */
export function calculateAverage(grades: Grade[]): number | null {
  if (grades.length === 0) return null;

  const totalWeight = grades.reduce((sum, g) => sum + (g.coefficient ?? 1), 0);
  if (totalWeight === 0) return null;

  const weightedSum = grades.reduce(
    (sum, g) => sum + g.gradeValue * (g.coefficient ?? 1),
    0
  );

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}
