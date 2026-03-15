import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { generateId, generateStudentMatricule } from '@/lib/id';
import type { User, CreateStudentInput } from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const studentKeys = {
  all: ['students'] as const,
  list: (classId?: string) => ['students', 'list', classId ?? 'all'] as const,
  detail: (id: string) => ['students', 'detail', id] as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────

export function useStudents(classId?: string) {
  return useQuery({
    queryKey: studentKeys.list(classId),
    queryFn: async (): Promise<User[]> => {
      // Use simple where clause — filter by role first
      const result = await blink.db.users.list({
        where: { role: 'student' },
        orderBy: { lastName: 'asc' },
      });

      const students = result as User[];

      // Filter by classId client-side if needed
      if (classId) {
        return students.filter((s) => s.classId === classId);
      }

      return students;
    },
  });
}

// ─── Single Student ───────────────────────────────────────────────────────────

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: async (): Promise<User | null> => {
      const result = await blink.db.users.get(id);
      return result as User | null;
    },
    enabled: Boolean(id),
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStudentInput): Promise<User> => {
      const newUser = await blink.db.users.create({
        id: generateId(),
        email: data.email,
        matricule: generateStudentMatricule(),
        passwordHash: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'student',
        classId: data.classId ?? null,
        isActive: 1,
        createdAt: new Date().toISOString(),
      });

      return newUser as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<User, 'id' | 'createdAt'>>;
    }): Promise<User> => {
      const updated = await blink.db.users.update(id, data);
      return updated as User;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await blink.db.users.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}
