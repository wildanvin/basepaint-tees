import type { DemoProduct } from "@/lib/demo-product";

export type AgentRun = {
  id: string;
  basepaintDay: number;
  status: "success" | "error";
  message: string;
  product?: DemoProduct;
  createdAt: string;
};

type MockStore = {
  activeProduct?: DemoProduct;
  productsByDay: Map<number, DemoProduct>;
  runs: AgentRun[];
};

const globalStore = globalThis as typeof globalThis & {
  __basepaintTeesStore?: MockStore;
};

export const mockStore: MockStore =
  globalStore.__basepaintTeesStore ??
  (globalStore.__basepaintTeesStore = {
    productsByDay: new Map<number, DemoProduct>(),
    runs: [],
  });

export function upsertDailyProduct(product: DemoProduct) {
  mockStore.productsByDay.set(product.basepaintDay, product);
  mockStore.activeProduct = product;

  return product;
}

export function getActiveProduct() {
  return mockStore.activeProduct;
}

export function recordAgentRun(run: Omit<AgentRun, "id" | "createdAt">) {
  const agentRun: AgentRun = {
    ...run,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  mockStore.runs = [agentRun, ...mockStore.runs].slice(0, 10);

  return agentRun;
}

export function getRecentAgentRuns() {
  return mockStore.runs;
}
