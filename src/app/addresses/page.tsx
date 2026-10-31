"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Address } from "@/lib/types";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { AddressForm, type AddressFormValue } from "@/components/layout/AddressForm";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
} from "@/components/ui";

export default function AddressesPage() {
  return (
    <RequireAuth>
      <AddressesView />
    </RequireAuth>
  );
}

const AddressesView = () => {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<AddressFormValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get<Address[]>("/address/my-addresses");
      setAddresses(res.data);
    } catch {
      setError("Could not load your addresses.");
      setAddresses([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!draft) return;
    setError(null);
    setSaving(true);

    try {
      await api.post("/address/create", draft);
      setShowForm(false);
      setDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this address.");
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (address: Address) => {
    setError(null);
    setBusyId(address.id);

    try {
      await api.patch(`/address/update/${address.id}`, { is_default: true });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this address.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (address: Address) => {
    setError(null);
    setBusyId(address.id);

    try {
      await api.remove(`/address/delete/${address.id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this address.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container-page py-10">
      <PageHeader
        title="Addresses"
        description="Saved addresses make checkout a single click."
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>Add address</Button>
          )
        }
      />

      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {showForm && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">New address</h2>
          <AddressForm onChange={setDraft} />
          <div className="mt-5 flex gap-2">
            <Button onClick={save} loading={saving} disabled={!draft}>
              Save address
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setDraft(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {addresses === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : addresses.length === 0 ? (
        !showForm && (
          <EmptyState
            title="No saved addresses"
            description="Add one now, or enter it during checkout."
            action={<Button onClick={() => setShowForm(true)}>Add address</Button>}
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{address.full_name}</p>
                  {address.label && (
                    <p className="text-xs text-slate-500">{address.label}</p>
                  )}
                </div>
                {address.is_default && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
                    Default
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-slate-600">
                {[
                  address.address_line1,
                  address.address_line2,
                  address.city,
                  address.state,
                  address.postal_code,
                  address.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="mt-1 text-sm text-slate-500">{address.phone}</p>

              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
                {!address.is_default && (
                  <button
                    onClick={() => makeDefault(address)}
                    disabled={busyId === address.id}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40"
                  >
                    Make default
                  </button>
                )}
                <button
                  onClick={() => remove(address)}
                  disabled={busyId === address.id}
                  className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
