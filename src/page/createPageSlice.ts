import { persist } from 'zustand/middleware';

export type Page = 'inspector' | 'component' | 'ui' | 'schedule';

export type PageSlice = {
  currentPage: Page;
};

export const createPageSlice = persist<PageSlice, [], [], Pick<PageSlice, 'currentPage'>>(
  (_set) => ({
    currentPage: 'inspector',
  }),
  {
    name: 'page',
    partialize: (state) => ({ currentPage: state.currentPage }),
  },
);
