import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, Department } from '@/types';
import { users, departments as mockDepartments } from '@/data/mockData';

interface UserState {
  currentUser: User | null;
  users: User[];
  departments: Department[];
  loading: boolean;
  login: (email?: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users,
      departments: mockDepartments,
      loading: false,

      login: (email = 'zhangwei@company.com') => {
        const user = get().users.find(u => u.email === email) || get().users[0];
        set({ currentUser: user, loading: false });
      },

      logout: () => {
        set({ currentUser: null });
      },

      switchRole: (role: UserRole) => {
        const { currentUser } = get();
        if (currentUser) {
          set({
            currentUser: { ...currentUser, role },
          });
        }
      },
    }),
    {
      name: 'asset-management-user',
    }
  )
);
