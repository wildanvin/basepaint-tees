export function normalizeWalletAddress(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const directAddress = value.match(/^0x[a-fA-F0-9]{40}$/)?.[0];
  const embeddedAddress = value.match(/0x[a-fA-F0-9]{40}/)?.[0];

  return (directAddress ?? embeddedAddress)?.toLowerCase();
}

export function walletAddressFromIdentityData(data: Record<string, unknown> | undefined) {
  if (!data) {
    return undefined;
  }

  return (
    normalizeWalletAddress(data.address) ??
    normalizeWalletAddress(data.wallet_address) ??
    normalizeWalletAddress(data.sub)
  );
}
