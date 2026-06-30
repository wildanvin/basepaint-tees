import { createConfig, http, injected } from "wagmi";
import { base } from "wagmi/chains";

export const baseChain = base;

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [injected()],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
