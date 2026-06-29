export const supportedShippingCountries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "ES", name: "Spain" },
  { code: "EC", name: "Ecuador" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
] as const;

export const supportedShippingCountryCodes: ReadonlySet<string> = new Set(
  supportedShippingCountries.map((country) => country.code),
);

export function isSupportedShippingCountry(countryCode: string) {
  return supportedShippingCountryCodes.has(countryCode.toUpperCase());
}
