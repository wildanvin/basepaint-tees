"use client";

import { supportedShippingCountries } from "@/lib/shipping-countries";

export const deliveryReferenceMaxLength = 60;

export type CheckoutFormState = {
  customerEmail: string;
  customerName: string;
  line1: string;
  line2: string;
  reference: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type CheckoutAddressFormProps = {
  form: CheckoutFormState;
  isLoading: boolean;
  onChange: (form: CheckoutFormState) => void;
  onSubmit: () => void;
};

export function CheckoutAddressForm({
  form,
  isLoading,
  onChange,
  onSubmit,
}: CheckoutAddressFormProps) {
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="min-h-11 border border-white/20 bg-[#050608] px-3 text-sm text-white placeholder:text-white/35"
          onChange={(event) => onChange({ ...form, customerEmail: event.target.value })}
          placeholder="Email"
          type="email"
          value={form.customerEmail}
        />
        <input
          className="min-h-11 border border-white/20 bg-[#050608] px-3 text-sm text-white placeholder:text-white/35"
          onChange={(event) => onChange({ ...form, customerName: event.target.value })}
          placeholder="Full name"
          value={form.customerName}
        />
      </div>

      <input
        className="min-h-11 border border-white/20 bg-[#050608] px-3 text-sm text-white placeholder:text-white/35"
        onChange={(event) => onChange({ ...form, line1: event.target.value })}
        placeholder="Address line 1"
        value={form.line1}
      />
      <input
        className="min-h-11 border border-white/20 bg-[#050608] px-3 text-sm text-white placeholder:text-white/35"
        onChange={(event) => onChange({ ...form, line2: event.target.value })}
        placeholder="Address line 2 (optional)"
        value={form.line2}
      />
      <div>
        <input
          className="min-h-11 w-full border border-white/20 bg-[#050608] px-3 text-sm text-white placeholder:text-white/35"
          maxLength={deliveryReferenceMaxLength}
          onChange={(event) => onChange({ ...form, reference: event.target.value })}
          placeholder="Delivery reference (optional)"
          value={form.reference}
        />
        <p className="mt-1 text-xs text-white/45">
          {form.reference.length}/{deliveryReferenceMaxLength}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="min-h-11 border border-white/20 bg-[#050608] px-3 text-sm text-white placeholder:text-white/35"
          onChange={(event) => onChange({ ...form, city: event.target.value })}
          placeholder="City"
          value={form.city}
        />
        <input
          className="min-h-11 border border-white/20 bg-[#050608] px-3 text-sm text-white placeholder:text-white/35"
          onChange={(event) => onChange({ ...form, state: event.target.value })}
          placeholder="State / province"
          value={form.state}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="min-h-11 border border-white/20 bg-[#050608] px-3 text-sm text-white placeholder:text-white/35"
          onChange={(event) => onChange({ ...form, postalCode: event.target.value })}
          placeholder="Postal code"
          value={form.postalCode}
        />
        <select
          className="min-h-11 border border-white/20 bg-[#050608] px-3 text-sm text-white"
          onChange={(event) => onChange({ ...form, country: event.target.value })}
          value={form.country}
        >
          {supportedShippingCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className="mt-2 flex min-h-12 w-full items-center justify-center border border-[#41c7ff] bg-[#41c7ff] px-5 font-mono text-sm font-black uppercase tracking-[0.16em] text-[#050608] transition hover:bg-white disabled:cursor-wait disabled:bg-[#696969]"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Checking shipping..." : "Next"}
      </button>
    </form>
  );
}
