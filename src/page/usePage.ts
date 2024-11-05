import { useStore } from '@/store';

export function usePage() {
  const currentPage = useStore((state) => state.currentPage);
  const setPage = useStore((state) => state.setPage);

  return [currentPage, setPage] as const;
}
