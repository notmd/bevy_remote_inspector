import { persist } from 'zustand/middleware';

export type Page = 'inspector' | 'component' | 'ui' | 'schedule';

export type PageSlice = {
  currentPage: Page;
  setPage: (page: Page) => void;
};

export const createPageSlice = persist<PageSlice, [], [], Pick<PageSlice, 'currentPage'>>(
  (set) => ({
    currentPage: 'inspector',
    setPage: (page: Page) => set({ currentPage: page }),
  }),
  { name: 'page', partialize: (state) => ({ currentPage: state.currentPage }) },
);
