// import { create } from "zustand";
// import { persist, createJSONStorage } from "zustand/middleware";

// export type AuthUser = { id: string; email: string; name: string; avatarUrl?: string; createdAt: number };

// export type StorePlan = "starter" | "growth" | "plus" | "enterprise";
// export type StoreStatus = "active" | "paused" | "trial" | "suspended";
// export type Store = {
//   id: string;
//   name: string;
//   slug: string;
//   logoUrl?: string | null;
//   url?: string;
//   status: StoreStatus;
//   plan: StorePlan;
//   updatedAt: number;
//   createdAt: number;
//   revenue?: number;
//   currency?: string;
// };

// type AuthState = {
//   [x: string]: any;
//   user: AuthUser | null;
//   hasStore: boolean;
//   stores: Store[];
//   activeStoreId: string | null;

//   signUp: (data: { email: string; name?: string; password?: string }) => AuthUser;
//   signIn: (data: { email: string; password?: string }) => AuthUser;
//   signOut: () => void;
//   markHasStore: (v: boolean) => void;
//   updateProfile: (patch: Partial<AuthUser>) => void;

//   // multi-store
//   createStore: (input: { name: string; slug?: string; plan?: StorePlan; logoUrl?: string | null }) => Store;
//   updateStore: (id: string, patch: Partial<Omit<Store, "id" | "createdAt">>) => void;
//   deleteStore: (id: string) => void;
//   switchStore: (id: string) => void;
//   getActiveStore: () => Store | null;
//   ensureDefaultStore: () => Store;
// };

// function uid(prefix = "u") { return prefix + "_" + Math.random().toString(36).slice(2, 10); }
// function slugify(s: string) {
//   return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-store";
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set, get) => ({
//       user: null,
//       hasStore: false,
//       stores: [],
//       activeStoreId: null,

//       signUp: ({ email, name }) => {
//         const user: AuthUser = {
//           id: uid("u"),
//           email,
//           name: name || email.split("@")[0].replace(/[^a-z0-9]+/gi, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
//           createdAt: Date.now(),
//         };
//         set({ user, hasStore: get().stores.length > 0 });
//         return user;
//       },
//       signIn: ({ email }) => {
//         const existing = get().user;
//         if (existing && existing.email === email) { return existing; }
//         const user: AuthUser = {
//           id: uid("u"),
//           email,
//           name: email.split("@")[0].replace(/[^a-z0-9]+/gi, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
//           createdAt: Date.now(),
//         };
//         set({ user, hasStore: get().stores.length > 0 });
//         return user;
//       },
//       signOut: () => set({ user: null, hasStore: false, activeStoreId: null }),
//       markHasStore: (v) => set({ hasStore: v }),
//       updateProfile: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

//       createStore: (input) => {
//         const slug = slugify(input.slug || input.name);
//         const store: Store = {
//           id: uid("st"),
//           name: input.name.trim() || "Untitled store",
//           slug,
//           logoUrl: input.logoUrl ?? null,
//           url: `/site/${slug}`,
//           status: "trial",
//           plan: input.plan ?? "starter",
//           updatedAt: Date.now(),
//           createdAt: Date.now(),
//           revenue: 0,
//           currency: "USD",
//         };
//         set((s) => ({
//           stores: [...s.stores, store],
//           activeStoreId: s.activeStoreId ?? store.id,
//           hasStore: true,
//         }));
//         return store;
//       },
//       updateStore: (id, patch) => set((s) => ({
//         stores: s.stores.map((st) => (st.id === id ? { ...st, ...patch, updatedAt: Date.now() } : st)),
//       })),
//       deleteStore: (id) => set((s) => {
//         const stores = s.stores.filter((st) => st.id !== id);
//         const activeStoreId = s.activeStoreId === id ? (stores[0]?.id ?? null) : s.activeStoreId;
//         return { stores, activeStoreId, hasStore: stores.length > 0 };
//       }),
//       switchStore: (id) => set((s) => (s.stores.some((st) => st.id === id) ? { activeStoreId: id } : s)),
//       getActiveStore: () => {
//         const { stores, activeStoreId } = get();
//         return stores.find((s) => s.id === activeStoreId) ?? null;
//       },
//       ensureDefaultStore: () => {
//         const s = get();
//         if (s.activeStoreId) {
//           const found = s.stores.find((x) => x.id === s.activeStoreId);
//           if (found) return found;
//         }
//         if (s.stores[0]) {
//           set({ activeStoreId: s.stores[0].id });
//           return s.stores[0];
//         }
//         return get().createStore({ name: "My Store" });
//       },
//     }),
//     {
//       name: "aether.auth.v2",
//       version: 2,
//       storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as any))),
//       migrate: (persisted: any, version) => {
//         if (!persisted) return persisted;
//         if (version < 2) {
//           return { ...persisted, stores: persisted.stores ?? [], activeStoreId: persisted.activeStoreId ?? null };
//         }
//         return persisted;
//       },
//     },
//   ),
// );


// // import { create } from "zustand";
// // import { persist, createJSONStorage } from "zustand/middleware";

// // export type AuthUser = {
// //   id: string;
// //   email: string;
// //   name: string;
// //   createdAt?: string;
// // };

// // export type StorePlan = "starter" | "growth" | "plus" | "enterprise";
// // export type StoreStatus = "active" | "paused" | "trial" | "suspended";

// // export type Store = {
// //   id: string;
// //   name: string;
// //   slug: string;
// //   logoUrl?: string | null;
// //   url?: string;
// //   status: StoreStatus;
// //   plan: StorePlan;
// //   updatedAt: number;
// //   createdAt: number;
// //   revenue?: number;
// //   currency?: string;
// // };

// // type AuthState = {
// //   signInForm: any;
// //   SignUpFrom: any;
// //   user: AuthUser | null;
// //   hasStore: boolean;

// //   stores: Store[];
// //   activeStoreId: string | null;

// //   setUser: (user: AuthUser | null) => void;

// //   signOut: () => void;

// //   markHasStore: (v: boolean) => void;

// //   updateProfile: (patch: Partial<AuthUser>) => void;

// //   createStore: (input: {
// //     name: string;
// //     slug?: string;
// //     plan?: StorePlan;
// //     logoUrl?: string | null;
// //   }) => Store;

// //   updateStore: (
// //     id: string,
// //     patch: Partial<Omit<Store, "id" | "createdAt">>
// //   ) => void;

// //   deleteStore: (id: string) => void;

// //   switchStore: (id: string) => void;

// //   getActiveStore: () => Store | null;

// //   ensureDefaultStore: () => Store;
// // };

// // function uid(prefix = "st") {
// //   return prefix + "_" + Math.random().toString(36).slice(2, 10);
// // }

// // function slugify(s: string) {
// //   return (
// //     s
// //       .toLowerCase()
// //       .trim()
// //       .replace(/[^a-z0-9]+/g, "-")
// //       .replace(/^-|-$/g, "") || "my-store"
// //   );
// // }

// // export const useAuthStore = create<AuthState>()(
// //   persist(
// //     (set, get) => ({
// //       user: null,

// //       hasStore: false,

// //       stores: [],

// //       activeStoreId: null,

// //       setUser: (user) =>
// //         set({
// //           user,
// //         }),

// //       signOut: () =>
// //         set({
// //           user: null,
// //           hasStore: false,
// //           activeStoreId: null,
// //         }),

// //       markHasStore: (v) =>
// //         set({
// //           hasStore: v,
// //         }),

// //       updateProfile: (patch) =>
// //         set((s) => ({
// //           user: s.user
// //             ? {
// //                 ...s.user,
// //                 ...patch,
// //               }
// //             : null,
// //         })),

// //       createStore: (input) => {
// //         const slug = slugify(input.slug || input.name);

// //         const store: Store = {
// //           id: uid(),

// //           name: input.name,

// //           slug,

// //           logoUrl: input.logoUrl ?? null,

// //           url: `/site/${slug}`,

// //           status: "trial",

// //           plan: input.plan ?? "starter",

// //           updatedAt: Date.now(),

// //           createdAt: Date.now(),

// //           revenue: 0,

// //           currency: "USD",
// //         };

// //         set((s) => ({
// //           stores: [...s.stores, store],
// //           activeStoreId: s.activeStoreId ?? store.id,
// //           hasStore: true,
// //         }));

// //         return store;
// //       },

// //       updateStore: (id, patch) =>
// //         set((s) => ({
// //           stores: s.stores.map((st) =>
// //             st.id === id
// //               ? {
// //                   ...st,
// //                   ...patch,
// //                   updatedAt: Date.now(),
// //                 }
// //               : st
// //           ),
// //         })),

// //       deleteStore: (id) =>
// //         set((s) => {
// //           const stores = s.stores.filter((x) => x.id !== id);

// //           return {
// //             stores,
// //             activeStoreId:
// //               s.activeStoreId === id
// //                 ? stores[0]?.id ?? null
// //                 : s.activeStoreId,
// //             hasStore: stores.length > 0,
// //           };
// //         }),

// //       switchStore: (id) =>
// //         set((s) =>
// //           s.stores.some((x) => x.id === id)
// //             ? {
// //                 activeStoreId: id,
// //               }
// //             : s
// //         ),

// //       getActiveStore: () => {
// //         const { stores, activeStoreId } = get();

// //         return (
// //           stores.find((x) => x.id === activeStoreId) ?? null
// //         );
// //       },

// //       ensureDefaultStore: () => {
// //         const state = get();

// //         if (state.activeStoreId) {
// //           const found = state.stores.find(
// //             (x) => x.id === state.activeStoreId
// //           );

// //           if (found) return found;
// //         }

// //         if (state.stores[0]) {
// //           set({
// //             activeStoreId: state.stores[0].id,
// //           });

// //           return state.stores[0];
// //         }

// //         return get().createStore({
// //           name: "My Store",
// //         });
// //       },
// //     }),
// //     {
// //       name: "aether.auth.v2",

// //       version: 3,

// //       storage: createJSONStorage(() => localStorage),
// //     }
// //   )
// // );


















import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: number;
  roles?: string[];
  isAdmin?: boolean;
};

export type StorePlan = "starter" | "growth" | "plus" | "enterprise";
export type StoreStatus = "active" | "paused" | "trial" | "suspended";
export type Store = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  url?: string;
  status: StoreStatus;
  plan: StorePlan;
  updatedAt: number;
  createdAt: number;
  revenue?: number;
  currency?: string;
};

type AuthState = {
  [x: string]: any;
  user: AuthUser | null;
  hasStore: boolean;
  stores: Store[];
  activeStoreId: string | null;

  signUp: (data: { email: string; name?: string; password?: string }) => AuthUser;
  signIn: (data: { email: string; password?: string }) => AuthUser;

  // ✅ ADD THIS
  setUser: (user: AuthUser) => void;

  // ISSUE 1 FIX: Add method to set stores from backend
  setStores: (stores: Store[]) => void;

  signOut: () => void;
  markHasStore: (v: boolean) => void;
  updateProfile: (patch: Partial<AuthUser>) => void;

  createStore: (input: {
    name: string;
    slug?: string;
    plan?: StorePlan;
    logoUrl?: string | null;
  }) => Store;

  updateStore: (
    id: string,
    patch: Partial<Omit<Store, "id" | "createdAt">>
  ) => void;

  deleteStore: (id: string) => void;
  switchStore: (id: string) => void;
  getActiveStore: () => Store | null;
  ensureDefaultStore: () => Store;
};



function uid(prefix = "u") { return prefix + "_" + Math.random().toString(36).slice(2, 10); }
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-store";
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      hasStore: false,
      stores: [],
      activeStoreId: null,

      signUp: ({ email, name }) => {
        const user: AuthUser = {
          id: uid("u"),
          email,
          name: name || email.split("@")[0].replace(/[^a-z0-9]+/gi, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          createdAt: Date.now(),
        };
        set({ user, hasStore: get().stores.length > 0 });
        return user;
      },
      signIn: ({ email }) => {
        const existing = get().user;
        if (existing && existing.email === email) { return existing; }
        const user: AuthUser = {
          id: uid("u"),
          email,
          name: email.split("@")[0].replace(/[^a-z0-9]+/gi, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          createdAt: Date.now(),
        };
        set({ user, hasStore: get().stores.length > 0 });
        return user;
      },
      // ✅ ADD THIS
setUser: (user) => {
  set({
    user,
    hasStore: get().stores.length > 0,
  });
},
      // ISSUE 1 FIX: Set stores from backend
      setStores: (stores) => {
        set({
          stores,
          hasStore: stores.length > 0,
          activeStoreId: stores.length > 0 ? stores[0].id : null,
        });
      },
      signOut: () => set({ user: null, hasStore: false, activeStoreId: null, stores: [] }),
      markHasStore: (v) => set({ hasStore: v }),
      updateProfile: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

      createStore: (input) => {
        const slug = slugify(input.slug || input.name);
        const store: Store = {
          id: uid("st"),
          name: input.name.trim() || "Untitled store",
          slug,
          logoUrl: input.logoUrl ?? null,
          url: `/site/${slug}`,
          status: "trial",
          plan: input.plan ?? "starter",
          updatedAt: Date.now(),
          createdAt: Date.now(),
          revenue: 0,
          currency: "USD",
        };
        set((s) => ({
          stores: [...s.stores, store],
          activeStoreId: s.activeStoreId ?? store.id,
          hasStore: true,
        }));
        return store;
      },
      updateStore: (id, patch) => set((s) => ({
        stores: s.stores.map((st) => (st.id === id ? { ...st, ...patch, updatedAt: Date.now() } : st)),
      })),
      deleteStore: (id) => set((s) => {
        const stores = s.stores.filter((st) => st.id !== id);
        const activeStoreId = s.activeStoreId === id ? (stores[0]?.id ?? null) : s.activeStoreId;
        return { stores, activeStoreId, hasStore: stores.length > 0 };
      }),
      switchStore: (id) => set((s) => (s.stores.some((st) => st.id === id) ? { activeStoreId: id } : s)),
      getActiveStore: () => {
        const { stores, activeStoreId } = get();
        return stores.find((s) => s.id === activeStoreId) ?? null;
      },
      ensureDefaultStore: () => {
        const s = get();
        if (s.activeStoreId) {
          const found = s.stores.find((x) => x.id === s.activeStoreId);
          if (found) return found;
        }
        if (s.stores[0]) {
          set({ activeStoreId: s.stores[0].id });
          return s.stores[0];
        }
        return get().createStore({ name: "My Store" });
      },
    }),
    {
      name: "aether.auth.v2",
      version: 2,
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as any))),
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        if (version < 2) {
          return { ...persisted, stores: persisted.stores ?? [], activeStoreId: persisted.activeStoreId ?? null };
        }
        return persisted;
      },
    },
  ),
);


