import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type DomainStatus = "available" | "unavailable" | "premium";

export type OrderDetails = {
  name: string;
  email: string;
  country: string;
  company?: string;
  acceptedTerms: boolean;
};

export type OrderState = {
  domain: string;
  domainStatus: DomainStatus | null;
  selectedTemplateId: string | null;
  selectedTemplateName: string | null;
  subscriptionYears: number | null;
  details: OrderDetails;
  promoCode: string;
  appliedPromo: {
    id: string;
    code: string;
    promoName: string;
    discountUsd: number;
  } | null;
};

type OrderContextValue = {
  state: OrderState;
  setDomain: (domain: string) => void;
  setDomainStatus: (status: DomainStatus | null) => void;
  setTemplate: (template: { id: string; name: string } | null) => void;
  setSubscriptionYears: (years: number | null) => void;
  setDetails: (patch: Partial<OrderDetails>) => void;
  setPromoCode: (code: string) => void;
  setAppliedPromo: (promo: OrderState["appliedPromo"]) => void;
  reset: () => void;
};

const STORAGE_KEY = "ema_order_v1";

const defaultState: OrderState = {
  domain: "",
  domainStatus: null,
  selectedTemplateId: null,
  selectedTemplateName: null,
  subscriptionYears: null,
  details: {
    name: "",
    email: "",
    country: "",
    company: "",
    acceptedTerms: false,
  },
  promoCode: "",
  appliedPromo: null,
};

const OrderContext = createContext<OrderContextValue | null>(null);

function safeParse(json: string | null): OrderState | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<OrderState>;
    return {
      ...defaultState,
      ...parsed,
      details: { ...defaultState.details, ...(parsed.details ?? {}) },
    };
  } catch {
    return null;
  }
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OrderState>(() => safeParse(localStorage.getItem(STORAGE_KEY)) ?? defaultState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<OrderContextValue>(
    () => ({
      state,
      setDomain: (domain) => setState((s) => ({ ...s, domain })),
      setDomainStatus: (domainStatus) => setState((s) => ({ ...s, domainStatus })),
      setTemplate: (template) =>
        setState((s) => ({
          ...s,
          selectedTemplateId: template?.id ?? null,
          selectedTemplateName: template?.name ?? null,
        })),
      setSubscriptionYears: (subscriptionYears) => setState((s) => ({ ...s, subscriptionYears })),
      setDetails: (patch) => setState((s) => ({ ...s, details: { ...s.details, ...patch } })),
      setPromoCode: (promoCode) => setState((s) => ({ ...s, promoCode })),
      setAppliedPromo: (appliedPromo) => setState((s) => ({ ...s, appliedPromo })),
      reset: () => setState(defaultState),
    }),
    [state],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
