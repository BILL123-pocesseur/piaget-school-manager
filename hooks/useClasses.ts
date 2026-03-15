import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { generateId } from '@/lib/id';
import type { Class, CreateClassInput } from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const classKeys = {
  all: ['classes'] as const,
  list: () => ['classes', 'list'] as const,
  detail: (id: string) => ['classes', 'detail', id] as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────

export function useClasses() {
  return useQuery({
    queryKey: classKeys.list(),
    queryFn: async (): Promise<Class[]> => {
      const result = await blink.db.classes.list({
        orderBy: { name: 'asc' },
      });
      return result as Class[];
    },
  });
}

// ─── Single Class ─────────────────────────────────────────────────────────────

export function useClass(id: string) {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: async (): Promise<Class | null> => {
      const result = await blink.db.classes.get(id);
      return result as Class | null;
    },
    enabled: Boolean(id),
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClassInput): Promise<Class> => {
      const newClass = await blink.db.classes.create({
        id: generateId(),
        name: data.name,
        level: data.level,
        academicYear: data.academicYear,
        createdAt: new Date().toISOString(),
      });

      return newClass as Class;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}
