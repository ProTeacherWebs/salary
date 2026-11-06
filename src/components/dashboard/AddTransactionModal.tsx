"use client";

import { useState, useTransition } from "react";
import { Account, Category } from "@/db/schema";
import { createTransactionAction } from "@/app/actions/finance";
import {
  Plus,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Loader2,
  Calendar,
} from "lucide-react";

interface AddTransactionModalProps {
  accounts: Account[];
  categories: Category[];
}

export function AddTransactionModal({ accounts, categories }: AddTransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((cat) => cat.type === type);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("type", type);

    startTransition(async () => {
      const res = await createTransactionAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        form.reset();
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Добавить операцию</span>
      </button>

      {/* Модальное окно */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-150">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Новая операция
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Выбор типа операции */}
            <div className="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
                  type === "expense"
                    ? "bg-red-500 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                <span>Расход</span>
              </button>

              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
                  type === "income"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Доход</span>
              </button>

              <button
                type="button"
                onClick={() => setType("transfer")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
                  type === "transfer"
                    ? "bg-blue-500 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Перевод</span>
              </button>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Поле суммы */}
              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Сумма операции
                </label>
                <div className="relative">
                  <input
                    name="amount"
                    type="number"
                    step="any"
                    required
                    autoFocus
                    placeholder="0"
                    className="w-full text-2xl font-black px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-lg">
                    ₽
                  </span>
                </div>
              </div>

              {/* Выбор счёта */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                    {type === "transfer" ? "Откуда перевести" : "Счёт списания / зачисления"}
                  </label>
                  <select
                    name="accountId"
                    required
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.balance} ₽)
                      </option>
                    ))}
                  </select>
                </div>

                {type === "transfer" ? (
                  <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                      Куда зачислить
                    </label>
                    <select
                      name="toAccountId"
                      required
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.balance} ₽)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                      Категория
                    </label>
                    <select
                      name="categoryId"
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="">Без категории</option>
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Дата и Комментарий */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                    Дата
                  </label>
                  <div className="relative">
                    <input
                      name="date"
                      type="date"
                      defaultValue={todayStr}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                    Комментарий (необязательно)
                  </label>
                  <input
                    name="description"
                    placeholder="Например: Обед с коллегами"
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Добавить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

