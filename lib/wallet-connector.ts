import type { Connector } from "wagmi";

const missingWalletMessage =
  "No browser wallet detected. Install MetaMask, Rabby, or Coinbase Wallet, or enable Brave Wallet for this site.";

export async function findAvailableConnector(
  preferredConnector: Connector | undefined,
  connectors: readonly Connector[],
) {
  const candidates = [
    preferredConnector,
    connectors.find((connector) => connector.id === "injected"),
    ...connectors,
  ].filter((connector, index, all): connector is Connector => {
    return Boolean(connector) && all.findIndex((item) => item?.uid === connector?.uid) === index;
  });

  for (const connector of candidates) {
    const provider = await connector.getProvider().catch(() => undefined);

    if (provider) {
      return { connector, provider };
    }
  }

  throw new Error(missingWalletMessage);
}

export function getWalletErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "ProviderNotFoundError" || error.message.includes("Provider not found")) {
      return missingWalletMessage;
    }

    if (error.message.includes("User rejected")) {
      return "Wallet request was rejected.";
    }

    return error.message;
  }

  return "Wallet request failed.";
}
