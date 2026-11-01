"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Category, ProductType } from "@/lib/types";
import { productTypeLabel, toNumber } from "@/lib/format";
import { RequireAuth } from "@/components/layout/RequireAuth";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";

const types: ProductType[] = ["PHYSICAL", "DIGITAL", "SERVICE", "RENTAL"];

export default function AdminCategoriesPage() {
  return (
    <RequireAuth guard="admin">
      <AdminCategoriesView />
    </RequireAuth>
  );
}

const AdminCategoriesView = () => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    parent_id: "",
    description: "",
    product_type: "",
    sort_order: "0",
  });

  const load = useCallback(async () => {
    setCategories(null);

    try {
      const res = await api.get<Category[]>("/category/all", {
        query: { limit: 100 },
      });
      setCategories(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load categories.");
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (key: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      await api.post("/category/create", {
        name: form.name.trim(),
        ...(form.parent_id ? { parent_id: form.parent_id } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        ...(form.product_type ? { product_type: form.product_type } : {}),
        sort_order: Number(form.sort_order) || 0,
      });

      setNotice(`Category "${form.name.trim()}" created.`);
      setForm({ name: "", parent_id: "", description: "", product_type: "", sort_order: "0" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create this category.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category: Category) => {
    setError(null);
    setNotice(null);
    setBusyId(category.id);

    try {
      await api.remove(`/category/delete/${category.id}`);
      setNotice(`Category "${category.name}" deleted.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this category.");
    } finally {
      setBusyId(null);
    }
  };

  // Parent name lookup so the table can show hierarchy without another request
  const nameById = new Map((categories || []).map((item) => [item.id, item.name]));

  return (
    <>
      <PageHeader
        title="Categories"
        description="Categories organise the catalogue and power the storefront filters."
        action={
          !showForm && <Button onClick={() => setShowForm(true)}>Add category</Button>
        }
      />

      {notice && (
        <div className="mb-6">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {showForm && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">New category</h2>

          <form onSubmit={create} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <Input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Laptops"
                />
              </Field>

              <Field label="Parent category" hint="Leave empty for a top level category">
                <Select value={form.parent_id} onChange={update("parent_id")}>
                  <option value="">No parent</option>
                  {(categories || []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={update("description")}
                className="min-h-20"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Restrict to type"
                hint="Leave as any so every product type can use it"
              >
                <Select value={form.product_type} onChange={update("product_type")}>
                  <option value="">Any type</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {productTypeLabel[type]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Sort order" hint="Lower numbers appear first">
                <Input type="number" value={form.sort_order} onChange={update("sort_order")} />
              </Field>
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={saving}>
                Create category
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {categories === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : categories.length === 0 ? (
        !showForm && (
          <EmptyState
            title="No categories yet"
            description="Create the first category so vendors can classify their products."
            action={<Button onClick={() => setShowForm(true)}>Add category</Button>}
          />
        )
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Parent</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{category.name}</p>
                      <p className="font-mono text-xs text-slate-400">{category.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {category.parent_id ? nameById.get(category.parent_id) || "—" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {category.product_type ? (
                        <Badge>{productTypeLabel[category.product_type]}</Badge>
                      ) : (
                        <span className="text-slate-400">Any</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {toNumber(category.product_count)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(category)}
                        disabled={busyId === category.id}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
};
