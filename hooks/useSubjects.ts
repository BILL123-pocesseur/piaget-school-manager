import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { generateId } from '@/lib/id';
import type { Subject, CreateSubjectInput } from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const subjectKeys = {
  all: ['subjects'] as const,
  list: () => ['subjects', 'list'] as const,
  detail: (id: string) => ['subjects', 'detail', id] as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.list(),
    queryFn: async (): Promise<Subject[]> => {
      const result = await blink.db.subjects.list({
        orderBy: { name: 'asc' },
      });
      return result as Subject[];
    },
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubjectInput): Promise<Subject> => {
      const newSubject = await blink.db.subjects.create({
        id: generateId(),
        name: data.name,
        coefficient: data.coefficient ?? 1,
        createdAt: new Date().toISOString(),
      });

      return newSubject as Subject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}
