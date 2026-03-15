import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { generateId, generateTeacherMatricule } from '@/lib/id';
import type { User, CreateTeacherInput } from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const teacherKeys = {
  all: ['teachers'] as const,
  list: () => ['teachers', 'list'] as const,
  detail: (id: string) => ['teachers', 'detail', id] as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────

export function useTeachers() {
  return useQuery({
    queryKey: teacherKeys.list(),
    queryFn: async (): Promise<User[]> => {
      const result = await blink.db.users.list({
        where: { role: 'teacher' },
        orderBy: { lastName: 'asc' },
      });
      return result as User[];
    },
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTeacherInput): Promise<User> => {
      const newTeacher = await blink.db.users.create({
        id: generateId(),
        email: data.email,
        matricule: generateTeacherMatricule(),
        passwordHash: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'teacher',
        classId: null,
        isActive: 1,
        createdAt: new Date().toISOString(),
      });

      return newTeacher as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
  });
}
