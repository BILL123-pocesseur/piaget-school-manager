import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { generateId } from '@/lib/id';
import type { Attendance, CreateAttendanceInput } from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const attendanceKeys = {
  all: ['attendance'] as const,
  list: (studentId?: string, type?: string) =>
    ['attendance', 'list', studentId ?? 'all', type ?? 'all'] as const,
  byStudent: (studentId: string) =>
    ['attendance', 'student', studentId] as const,
};

// ─── List (with optional filters) ────────────────────────────────────────────

export function useAttendance(studentId?: string, type?: string) {
  return useQuery({
    queryKey: attendanceKeys.list(studentId, type),
    queryFn: async (): Promise<Attendance[]> => {
      // Use single-field where to avoid AND issues, filter rest client-side
      const where = studentId
        ? { studentId }
        : type
        ? { type }
        : undefined;

      const result = await blink.db.attendance.list({
        where,
        orderBy: { date: 'desc' },
      });

      let records = result as Attendance[];

      // Apply secondary filter client-side
      if (studentId && type) {
        records = records.filter((r) => r.type === type);
      }

      return records;
    },
  });
}

// ─── By Student ───────────────────────────────────────────────────────────────

export function useAttendanceByStudent(studentId: string) {
  return useQuery({
    queryKey: attendanceKeys.byStudent(studentId),
    queryFn: async (): Promise<Attendance[]> => {
      const result = await blink.db.attendance.list({
        where: { studentId },
        orderBy: { date: 'desc' },
      });
      return result as Attendance[];
    },
    enabled: Boolean(studentId),
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAttendanceInput): Promise<Attendance> => {
      const newRecord = await blink.db.attendance.create({
        id: generateId(),
        studentId: data.studentId,
        teacherId: data.teacherId,
        type: data.type,
        description: data.description ?? null,
        date: data.date,
        subjectId: data.subjectId ?? null,
        createdAt: new Date().toISOString(),
      });

      return newRecord as Attendance;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.byStudent(variables.studentId),
      });
    },
  });
}
