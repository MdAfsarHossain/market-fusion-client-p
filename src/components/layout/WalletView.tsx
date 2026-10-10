"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type {
  Meta,
  Wallet,
  WalletTransaction,
  Withdrawal,
  WithdrawalMethod,
} from "@/lib/types";
import { formatDate, formatPrice, humanize, statusTone, toNumber } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
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
  cn,
} from "@/components/ui";

const methods: { value: WithdrawalMethod; label: string; fields: string[] }[] = [
  { value: "BANK_TRANSFER", label: "Bank transfer", fields: ["account_name", "account_number", "bank_name"] },
  { value: "PAYPAL", label: "PayPal", fields: ["email"] },
  { value: "STRIPE", label: "Stripe", fields: ["account_id"] },
  { value: "MOBILE_BANKING", label: "Mobile banking", fields: ["provider", "number"] },
];

const fieldLabels: Record<string, string> = {
  account_name: "Account holder name",
  account_number: "Account number",
  bank_name: "Bank name",
  email: "PayPal email",
  account_id: "Stripe account id",
  provider: "Provider (e.g. bKash)",
  number: "Mobile number",
};

// Ledger sources phrased for a human rather than an enum
const sourceLabels: Record<string, string> = {
  ORDER_EARNING: "Order earning",
  WITHDRAWAL: "Withdrawal",
  WITHDRAWAL_REVERSAL: "Withdrawal refunded",
  ORDER_REFUND: "Order refund",
  ADMIN_ADJUSTMENT: "Manual adjustment",
};

export const WalletView = ({ embedded = false }: { embedded?: boolean }) => {
  const { isVendor, isAdmin } = useAuth();
  const canWithdraw = isVendor || isAdmin;

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[] | null>(null);
  const [txnMeta, setTxnMeta] = useState<Meta | null>(null);
  const [txnPage, setTxnPage] = useState(1);
  const [txnType, setTxnType] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[] | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawalMethod>("BANK_TRANSFER");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    try {
      const res = await api.get<Wallet>("/wallet");
      setWallet(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your wallet.");
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTransactions(null);

    try {
      const res = await api.get<WalletTransaction[]>("/wallet/transactions", {
        query: { page: txnPage, limit: 10, type: txnType || undefined },
      });
      setTransactions(res.data);
      setTxnMeta(res.meta ?? null);
    } catch {
      setTransactions([]);
    }
  }, [txnPage, txnType]);

  const loadWithdrawals = useCallback(async () => {
    try {
      const res = await api.get<Withdrawal[]>("/wallet/withdrawals", {
        query: { limit: 10 },
      });
      setWithdrawals(res.data);
    } catch {
      setWithdrawals([]);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
    void loadWithdrawals();
  }, [loadWallet, loadWithdrawals]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const activeMethod = methods.find((m) => m.value === method)!;
  const detailsComplete = activeMethod.fields.every((field) =>
    String(details[field] || "").trim(),
  );

  const submitWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      await api.post("/wallet/withdrawals", {
        amount: Number(amount),
        method,
        account_details: details,
      });

      setNotice("Withdrawal requested. An admin will review it shortly.");
      setShowForm(false);
      setAmount("");
      setDetails({});
      await Promise.all([loadWallet(), loadWithdrawals(), loadTransactions()]);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not request that withdrawal.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!wallet) {
    return (
      <div className="flex justify-center py-16">
        {error ? <Alert>{error}</Alert> : <Spinner className="h-6 w-6 text-brand-600" />}
      </div>
    );
  }

  const currency = wallet.currency || "USD";

  return (
    <>
      <PageHeader
        title="Wallet"
        description={
          canWithdraw
            ? "Earnings land here once an order is completed."
            : "Refunds and credits land here."
        }
        action={
          canWithdraw &&
          !showForm && (
            <Button
              onClick={() => setShowForm(true)}
              disabled={wallet.available_balance < wallet.min_withdrawal}
            >
              Withdraw
            </Button>
          )
        }
      />

      {notice && (
        <div className="mb-6">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      {error && !showForm && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {canWithdraw ? "Available to withdraw" : "Available"}
          </p>
          <p className="mt-1.5 text-3xl font-semibold text-slate-900">
            {formatPrice(wallet.available_balance, currency)}
          </p>
          {canWithdraw && (
            <p className="mt-1 text-xs text-slate-400">
              Minimum payout {formatPrice(wallet.min_withdrawal, currency)}
            </p>
          )}
        </Card>

        {canWithdraw && (
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Payouts in progress
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">
              {formatPrice(wallet.pending_withdrawal, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Already taken from your balance
            </p>
          </Card>
        )}

        {canWithdraw && (
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              On the way
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">
              {formatPrice(wallet.upcoming_earning, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Released when orders complete
            </p>
          </Card>
        )}

        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {canWithdraw ? "Total earned" : "Total credited"}
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900">
            {formatPrice(wallet.total_earned, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {formatPrice(wallet.total_withdrawn, currency)} withdrawn
          </p>
        </Card>
      </div>

      {canWithdraw && showForm && (
        <Card className="mt-6 p-5">
          <h2 className="text-base font-semibold text-slate-900">
            Request a withdrawal
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Minimum {formatPrice(wallet.min_withdrawal, currency)}. You have{" "}
            {formatPrice(wallet.available_balance, currency)} available.
          </p>

          <form onSubmit={submitWithdrawal} className="mt-5 space-y-4">
            {error && <Alert>{error}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount" required>
                <Input
                  type="number"
                  required
                  min={wallet.min_withdrawal}
                  max={wallet.available_balance}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={String(wallet.min_withdrawal)}
                />
              </Field>

              <Field label="Payout method" required>
                <Select
                  value={method}
                  onChange={(event) => {
                    setMethod(event.target.value as WithdrawalMethod);
                    setDetails({});
                  }}
                >
                  {methods.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* The fields change with the payout method */}
            <div className="grid gap-4 sm:grid-cols-2">
              {activeMethod.fields.map((field) => (
                <Field key={field} label={fieldLabels[field] || field} required>
                  <Input
                    required
                    value={details[field] || ""}
                    onChange={(event) =>
                      setDetails((prev) => ({ ...prev, [field]: event.target.value }))
                    }
                  />
                </Field>
              ))}
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={submitting} disabled={!detailsComplete}>
                Request withdrawal
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {canWithdraw && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Withdrawals</h2>

          {withdrawals === null ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-5 w-5 text-brand-600" />
            </div>
          ) : withdrawals.length === 0 ? (
            <EmptyState
              title="No withdrawals yet"
              description="Once you have earnings you can request a payout."
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Requested</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Method</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawals.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatPrice(item.amount, item.currency)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {humanize(item.method)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusTone(item.status)}>
                            {humanize(item.status)}
                          </Badge>
                          {item.admin_note && (
                            <p className="mt-1 max-w-48 text-xs text-slate-500">
                              {item.admin_note}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>
      )}

      <section className={cn("mt-8", embedded && "pb-4")}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Transactions</h2>
          <Select
            className="w-36"
            value={txnType}
            onChange={(event) => {
              setTxnType(event.target.value);
              setTxnPage(1);
            }}
            aria-label="Filter transactions"
          >
            <option value="">All</option>
            <option value="CREDIT">Credits</option>
            <option value="DEBIT">Debits</option>
          </Select>
        </div>

        {transactions === null ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-5 w-5 text-brand-600" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Every credit and debit will be listed here."
          />
        ) : (
          <>
            <Card className="divide-y divide-slate-100 overflow-hidden">
              {transactions.map((txn) => {
                const isCredit = txn.type === "CREDIT";

                return (
                  <div key={txn.id} className="flex items-center gap-4 p-4">
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg font-semibold",
                        isCredit
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600",
                      )}
                      aria-hidden="true"
                    >
                      {isCredit ? "+" : "−"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {sourceLabels[txn.source] || humanize(txn.source)}
                      </p>
                      {txn.description && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {txn.description}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatDate(txn.createdAt)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isCredit ? "text-emerald-700" : "text-red-700",
                        )}
                      >
                        {isCredit ? "+" : "−"}
                        {formatPrice(txn.amount, txn.currency)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Balance {formatPrice(txn.balance_after, txn.currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </Card>

            {txnMeta && txnMeta.totalPage > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!txnMeta.hasPrevPage}
                  onClick={() => setTxnPage((value) => Math.max(1, value - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {txnMeta.page} of {txnMeta.totalPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!txnMeta.hasNextPage}
                  onClick={() => setTxnPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
};
