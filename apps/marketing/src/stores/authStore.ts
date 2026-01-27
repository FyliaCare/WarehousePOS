import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";

export interface User {
  id: string;
  email: string;
  full_name: string;
  business_name?: string;
  business_address?: string;
  country?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  tenant_id?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  business_type?: string;
  country?: string;
  currency?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_slug: "free" | "starter" | "growth" | "business";
  plan: "free" | "starter" | "growth" | "business"; // Alias for plan_slug
  billing_cycle: "monthly" | "yearly";
  status: "active" | "trialing" | "cancelled" | "expired" | "past_due";
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancelled_at?: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      subscription: null,
      isAuthenticated: false,
      loading: true,
      error: null,

      initialize: async () => {
        try {
          set({ loading: true, error: null });

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            // Fetch user profile from users table
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (userError) {
              console.error("Error fetching user:", userError);
            }

            let tenantData: Tenant | null = null;
            let subscriptionData: Subscription | null = null;

            // Get tenant data
            if (userData?.tenant_id) {
              const { data: tenant, error: tenantError } = await supabase
                .from("tenants")
                .select("*")
                .eq("id", userData.tenant_id)
                .single();

              if (tenantError) {
                console.error("Error fetching tenant:", tenantError);
              } else {
                tenantData = tenant;
              }

              // Fetch subscription from tenant_subscriptions table
              const { data: subData, error: subError } = await supabase
                .from("tenant_subscriptions")
                .select("*")
                .eq("tenant_id", userData.tenant_id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              // Ignore "table not found" and "no rows" errors
              if (
                subError &&
                subError.code !== "PGRST116" &&
                subError.code !== "PGRST205"
              ) {
                console.error("Error fetching subscription:", subError);
              }

              if (subData) {
                subscriptionData = {
                  ...subData,
                  plan: subData.plan_slug, // Alias for backwards compatibility
                };
              }
            }

            // Default subscription for users without one
            const defaultSubscription: Subscription = {
              id: "",
              tenant_id: userData?.tenant_id || "",
              plan_slug: "free",
              plan: "free",
              billing_cycle: "monthly",
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            };

            set({
              user: userData || {
                id: session.user.id,
                email: session.user.email || "",
                full_name: session.user.user_metadata?.full_name || "",
                created_at: session.user.created_at,
              },
              tenant: tenantData,
              subscription: subscriptionData || defaultSubscription,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            set({
              user: null,
              tenant: null,
              subscription: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        } catch (error: any) {
          console.error("Auth init error:", error);
          // On error, ensure we're in a clean state so user isn't stuck
          set({
            user: null,
            tenant: null,
            subscription: null,
            isAuthenticated: false,
            loading: false,
            error: null, // Don't show error, just redirect to login
          });
        }
      },

      checkAuth: async () => {
        await get().initialize();
      },

      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          // Real Supabase authentication
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          // Initialize will fetch user, tenant, and subscription data
          await get().initialize();
          return true;
        } catch (error: any) {
          console.error("Login error:", error);
          set({
            error: error.message || "Invalid email or password",
            loading: false,
          });
          return false;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          tenant: null,
          subscription: null,
          isAuthenticated: false,
          loading: false,
        });
      },

      updateProfile: async (updates: Partial<User>) => {
        try {
          const userId = get().user?.id;
          if (!userId) return false;

          const { error } = await supabase
            .from("users")
            .update(updates)
            .eq("id", userId);

          if (error) throw error;

          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          }));

          return true;
        } catch (error: any) {
          console.error("Update profile error:", error);
          set({ error: error.message });
          return false;
        }
      },

      refreshSubscription: async () => {
        const tenantId = get().tenant?.id;
        if (!tenantId) return;

        const { data, error } = await supabase
          .from("tenant_subscriptions")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Ignore "table not found" and "no rows" errors
        if (error && error.code !== "PGRST116" && error.code !== "PGRST205") {
          console.error("Error refreshing subscription:", error);
          return;
        }

        if (data) {
          set({
            subscription: {
              ...data,
              plan: data.plan_slug,
            },
          });
        }
      },
    }),
    {
      name: "warehouse-portal-auth",
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        subscription: state.subscription,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
