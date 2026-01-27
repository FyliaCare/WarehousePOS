import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";

// Types
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  bonus_credits: number;
  price_usd: number;
  price_ghs: number;
  price_ngn: number;
  per_credit_usd: number;
  per_credit_ghs: number;
  per_credit_ngn: number;
  is_popular: boolean;
}

export interface UserCredits {
  id: string;
  tenant_id: string;
  balance: number;
  monthly_credits: number;
  purchased_credits: number;
  bonus_credits: number;
  last_reset_at: string;
}

export interface MessagingBudget {
  id: string;
  tenant_id: string;
  monthly_limit: number;
  current_spend: number;
  currency: "USD" | "GHS" | "NGN";
  enabled: boolean;
}

export interface CreditTransaction {
  id: string;
  tenant_id: string;
  type:
    | "monthly_allocation"
    | "pack_purchase"
    | "payg_charge"
    | "usage"
    | "refund"
    | "adjustment"
    | "expiry";
  amount: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

interface CreditsState {
  // State
  userCredits: UserCredits | null;
  messagingBudget: MessagingBudget | null;
  creditPacks: CreditPack[];
  transactions: CreditTransaction[];
  loading: boolean;
  error: string | null;
  lastFetchedTenantId: string | null; // Track which tenant was last fetched
  creditPacksFetched: boolean; // Track if credit packs have been fetched

  // Computed
  totalCreditsAvailable: () => number;
  isPayAsYouGo: () => boolean;
  budgetRemaining: () => number;
  budgetUsagePercent: () => number;

  // Actions
  fetchCredits: (tenantId: string) => Promise<void>;
  fetchCreditPacks: () => Promise<void>;
  fetchTransactions: (tenantId: string, limit?: number) => Promise<void>;
  purchaseCredits: (packId: string, currency: string) => Promise<boolean>;
  updateBudget: (limit: number, enabled: boolean) => Promise<boolean>;
  refreshCredits: () => Promise<void>;
}

// Default credit packs
const defaultCreditPacks: CreditPack[] = [
  {
    id: "pack-100",
    name: "Starter",
    credits: 100,
    bonus_credits: 0,
    price_usd: 3,
    price_ghs: 25,
    price_ngn: 2500,
    per_credit_usd: 0.03,
    per_credit_ghs: 0.25,
    per_credit_ngn: 25,
    is_popular: false,
  },
  {
    id: "pack-300",
    name: "Basic",
    credits: 300,
    bonus_credits: 0,
    price_usd: 7,
    price_ghs: 55,
    price_ngn: 5500,
    per_credit_usd: 0.023,
    per_credit_ghs: 0.18,
    per_credit_ngn: 18,
    is_popular: false,
  },
  {
    id: "pack-600",
    name: "Standard",
    credits: 600,
    bonus_credits: 0,
    price_usd: 12,
    price_ghs: 95,
    price_ngn: 9500,
    per_credit_usd: 0.02,
    per_credit_ghs: 0.16,
    per_credit_ngn: 16,
    is_popular: true,
  },
  {
    id: "pack-1200",
    name: "Business",
    credits: 1200,
    bonus_credits: 0,
    price_usd: 20,
    price_ghs: 160,
    price_ngn: 16000,
    per_credit_usd: 0.017,
    per_credit_ghs: 0.13,
    per_credit_ngn: 13,
    is_popular: false,
  },
  {
    id: "pack-3000",
    name: "Pro",
    credits: 3000,
    bonus_credits: 0,
    price_usd: 45,
    price_ghs: 350,
    price_ngn: 35000,
    per_credit_usd: 0.015,
    per_credit_ghs: 0.12,
    per_credit_ngn: 12,
    is_popular: false,
  },
];

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      userCredits: null,
      messagingBudget: null,
      creditPacks: defaultCreditPacks,
      transactions: [],
      loading: false,
      error: null,
      lastFetchedTenantId: null,
      creditPacksFetched: false,

      totalCreditsAvailable: () => {
        const { userCredits } = get();
        if (!userCredits) return 0;
        return (
          userCredits.monthly_credits +
          userCredits.purchased_credits +
          userCredits.bonus_credits
        );
      },

      isPayAsYouGo: () => {
        const { messagingBudget } = get();
        return !!messagingBudget && messagingBudget.enabled;
      },

      budgetRemaining: () => {
        const { messagingBudget } = get();
        if (!messagingBudget) return 0;
        return Math.max(
          0,
          messagingBudget.monthly_limit - messagingBudget.current_spend,
        );
      },

      budgetUsagePercent: () => {
        const { messagingBudget } = get();
        if (!messagingBudget || messagingBudget.monthly_limit === 0) return 0;
        return (
          (messagingBudget.current_spend / messagingBudget.monthly_limit) * 100
        );
      },

      fetchCredits: async (tenantId: string) => {
        // Prevent refetching if already loading or already fetched for this tenant
        const state = get();
        if (state.loading || state.lastFetchedTenantId === tenantId) return;

        set({ loading: true, error: null, lastFetchedTenantId: tenantId });

        try {
          // Fetch tenant credits from database
          // Note: tenant_credits table may not exist yet, handle gracefully
          const { data: creditsData, error: creditsError } = await supabase
            .from("tenant_credits")
            .select("*")
            .eq("tenant_id", tenantId)
            .single();

          // Only log errors that aren't "table not found" or "no rows"
          if (
            creditsError &&
            creditsError.code !== "PGRST116" &&
            creditsError.code !== "PGRST205"
          ) {
            console.error("Error fetching credits:", creditsError);
          }

          // Fetch messaging budget
          // Note: messaging_budgets table may not exist yet, handle gracefully
          const { data: budgetData, error: budgetError } = await supabase
            .from("messaging_budgets")
            .select("*")
            .eq("tenant_id", tenantId)
            .single();

          // Only log errors that aren't "table not found" or "no rows"
          if (
            budgetError &&
            budgetError.code !== "PGRST116" &&
            budgetError.code !== "PGRST205"
          ) {
            console.error("Error fetching budget:", budgetError);
          }

          set({
            userCredits: creditsData || {
              id: "",
              tenant_id: tenantId,
              balance: 0,
              monthly_credits: 0,
              purchased_credits: 0,
              bonus_credits: 0,
              last_reset_at: new Date().toISOString(),
            },
            messagingBudget: budgetData || null,
            loading: false,
          });
        } catch (error: any) {
          console.error("Error fetching credits:", error);
          // Always provide defaults on error so UI doesn't break
          set({
            userCredits: {
              id: "",
              tenant_id: tenantId,
              balance: 0,
              monthly_credits: 0,
              purchased_credits: 0,
              bonus_credits: 0,
              last_reset_at: new Date().toISOString(),
            },
            messagingBudget: null,
            error: null, // Don't show error to user
            loading: false,
          });
        }
      },

      fetchCreditPacks: async () => {
        // Skip if already fetched
        if (get().creditPacksFetched) return;

        try {
          set({ creditPacksFetched: true });

          // Fetch credit packs from database
          const { data, error } = await supabase
            .from("credit_packs")
            .select("*")
            .eq("is_active", true)
            .order("credits", { ascending: true });

          // Silently handle table not found errors
          if (error && error.code !== "PGRST205") {
            console.error("Error fetching credit packs:", error);
            // Fall back to default packs if database fetch fails
            return;
          }

          if (data && data.length > 0) {
            set({ creditPacks: data });
          }
        } catch (error: any) {
          console.error("Error fetching credit packs:", error);
        }
      },

      fetchTransactions: async (tenantId: string, limit = 50) => {
        try {
          const { data, error } = await supabase
            .from("credit_transactions")
            .select("*")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })
            .limit(limit);

          if (error) {
            console.error("Error fetching transactions:", error);
            return;
          }

          set({ transactions: data || [] });
        } catch (error: any) {
          console.error("Error fetching transactions:", error);
          set({ error: error.message });
        }
      },

      purchaseCredits: async (packId: string, currency: string) => {
        try {
          set({ loading: true, error: null });

          const pack = get().creditPacks.find((p) => p.id === packId);
          if (!pack) {
            throw new Error("Credit pack not found");
          }

          // Would process payment via Paystack in production
          // For now, just add the credits
          const { userCredits } = get();
          if (userCredits) {
            set({
              userCredits: {
                ...userCredits,
                purchased_credits: userCredits.purchased_credits + pack.credits,
                bonus_credits: userCredits.bonus_credits + pack.bonus_credits,
              },
              loading: false,
            });
          }

          return true;
        } catch (error: any) {
          console.error("Error purchasing credits:", error);
          set({ error: error.message, loading: false });
          return false;
        }
      },

      updateBudget: async (limit: number, enabled: boolean) => {
        try {
          set({ loading: true, error: null });

          set({
            messagingBudget: {
              id: "budget-1",
              tenant_id: "",
              monthly_limit: limit,
              current_spend: 0,
              currency: "GHS",
              enabled,
            },
            loading: false,
          });

          return true;
        } catch (error: any) {
          console.error("Error updating budget:", error);
          set({ error: error.message, loading: false });
          return false;
        }
      },

      refreshCredits: async () => {
        // Reset lastFetchedTenantId to allow refetch
        const tenantId = get().userCredits?.tenant_id;
        if (tenantId) {
          set({ lastFetchedTenantId: null });
          await get().fetchCredits(tenantId);
        }
      },
    }),
    {
      name: "warehouse-marketing-credits",
      partialize: (state) => ({
        userCredits: state.userCredits,
        messagingBudget: state.messagingBudget,
        // Don't persist fetch state flags
      }),
    },
  ),
);
