"use client";

import { useEffect, useState } from "react";
import { Field, Input } from "@/components/ui";

export type AddressFormValue = {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
};

const empty: AddressFormValue = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

const requiredKeys: (keyof AddressFormValue)[] = [
  "full_name",
  "phone",
  "address_line1",
  "city",
  "postal_code",
  "country",
];

// Reports the value up only once every required field is filled, so the parent
// can enable its submit button without duplicating the validation.
export const AddressForm = ({
  initial,
  onChange,
}: {
  initial?: Partial<AddressFormValue>;
  onChange: (value: AddressFormValue | null) => void;
}) => {
  const [form, setForm] = useState<AddressFormValue>({ ...empty, ...initial });

  useEffect(() => {
    const complete = requiredKeys.every((key) => String(form[key] || "").trim().length > 0);
    onChange(complete ? form : null);
    // onChange identity is stable enough in practice; form is the real trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const update =
    (key: keyof AddressFormValue) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input value={form.full_name} onChange={update("full_name")} autoComplete="name" />
        </Field>
        <Field label="Phone" required>
          <Input value={form.phone} onChange={update("phone")} autoComplete="tel" />
        </Field>
      </div>

      <Field label="Address line 1" required>
        <Input
          value={form.address_line1}
          onChange={update("address_line1")}
          autoComplete="address-line1"
          placeholder="Street and number"
        />
      </Field>

      <Field label="Address line 2">
        <Input
          value={form.address_line2 || ""}
          onChange={update("address_line2")}
          autoComplete="address-line2"
          placeholder="Apartment, floor (optional)"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" required>
          <Input value={form.city} onChange={update("city")} autoComplete="address-level2" />
        </Field>
        <Field label="State / region">
          <Input
            value={form.state || ""}
            onChange={update("state")}
            autoComplete="address-level1"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Postal code" required>
          <Input
            value={form.postal_code}
            onChange={update("postal_code")}
            autoComplete="postal-code"
          />
        </Field>
        <Field label="Country" required>
          <Input value={form.country} onChange={update("country")} autoComplete="country-name" />
        </Field>
      </div>
    </div>
  );
};
