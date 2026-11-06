"use client";

import { useState, useTransition } from "react";
import { Account } from "@/db/schema";
import { createAccountAction, deleteAccountAction } from "@/app/actions/finance";
import {
  CreditCard,
  Wallet,
  Landmark,
  PiggyBank,
  Plus,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

interface AccountsSectionProps {
  accounts: Account[];
}

export function AccountsSection({ accounts }: AccountsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "cash":
        return <Wallet className="h-4 w-4" />;
      case "bank":
        return <Landmark className="h-4 w-4" />;
      case "savings":
        return <PiggyBank className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const formatMoney = (val: number, cur: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: cur || "RUB",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createAccountAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        form.reset();
        setIsOpen(false);
      }
    });
  };

  const handleDelete = (accountId: string, accountName: string) => {
    if (confirm(`Удалить счёт "${accountName}"? Все связанные операции также будут удалены.`)) {
      startTransition(async () => {
        await deleteAccountAction(accountId);
      });
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
      {/* Шапка блока счетов */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Мои Счета
          </h2>
          <p className="text-xs text-neutral-500">Банковские карты, наличные, вклады</p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
        >
          {isOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{isOpen ? "Отмена" : "Новый счёт"}</span>
        </button>
      </div>

      {/* Форма добавления нового счета */}
      {isOpen && (
        <form
          onSubmit={handleCreate}
          className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 space-y-3 animate-in fade-in duration-200"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Добавление счёта
          </h3>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 block mb-1">
                Название счёта
              </label>
              <input
                name="name"
                required
                placeholder="Например: Т-Банк Black"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 block mb-1">
                  Тип счёта
                </label>
                <select
                  name="type"
                  defaultValue="card"
                  className="w-full text-xs px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-neutral-100 cursor-pointer"
                >
                  <option value="card">Карта</option>
                  <option value="cash">Наличные</option>
                  <option value="savings">Сбережения / Вклад</option>
                  <option value="bank">Банковский счёт</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 block mb-1">
                  Начальный баланс
                </label>
                <input
                  name="balance"
                  type="number"
                  step="any"
                  defaultValue="0"
                  required
                  placeholder="0"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 block mb-1">
                Цвет карточки
              </label>
              <div className="flex items-center gap-2">
                <input
                  name="color"
                  type="color"
                  defaultValue="#3b82f6"
                  className="h-8 w-10 rounded cursor-pointer border-0 bg-transparent shrink-0"
                />
                <span className="text-xs text-neutral-400">Цвет акцента</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Сохранить</span>
            </button>
          </div>
        </form>
      )}

      {/* Список счетов (аккуратный вертикальный список карточек) */}
      <div className="space-y-2.5">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="group relative p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Левая часть: иконка + название + тип */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: acc.color || "#3b82f6" }}
                >
                  {getAccountIcon(acc.type)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight truncate">
                    {acc.name}
                  </h4>
                  <span className="text-[11px] text-neutral-400 capitalize block mt-0.5">
                    {acc.type === "card"
                      ? "Карта"
                      : acc.type === "cash"
                      ? "Наличные"
                      : acc.type === "savings"
                      ? "Сбережения"
                      : "Банковский счёт"}
                  </span>
                </div>
              </div>

              {/* Правая часть: баланс + удаление */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                    {formatMoney(acc.balance, acc.currency)}
                  </span>
                </div>

                {accounts.length > 1 && (
                  <button
                    onClick={() => handleDelete(acc.id, acc.name)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 transition-all p-1 cursor-pointer"
                    title="Удалить счёт"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
