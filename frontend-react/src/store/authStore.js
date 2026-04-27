import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            sessionVerified: false,

            login: (userData, token) => {
                set({ user: userData, token, isAuthenticated: true, sessionVerified: true });
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false, sessionVerified: false });
            },

            updateUser: (updates) => {
                const currentUser = get().user;
                set({ user: { ...currentUser, ...updates } });
            },

            getToken: () => get().token,

            verifySession: async () => {
                const token = get().token;
                if (!token) {
                    set({ isAuthenticated: false, sessionVerified: true });
                    return false;
                }

                try {
                    const response = await fetch(`${API_BASE}/auth/verify-token`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        set({ user: data.user, isAuthenticated: true, sessionVerified: true });
                        return true;
                    } else {
                        // Token expired or invalid — clear session
                        set({ user: null, token: null, isAuthenticated: false, sessionVerified: true });
                        return false;
                    }
                } catch (error) {
                    console.error('Session verification failed:', error);
                    set({ sessionVerified: true });
                    return false;
                }
            },
        }),
        {
            name: 'fundai-auth',
        }
    )
);

export default useAuthStore;
