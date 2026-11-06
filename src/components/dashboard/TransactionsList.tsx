"use client";

import { useState, useTransition, useMemo } from "react";
import { deleteTransactionAction } from "@/app/actions/finance";
import { Account, Category } from "@/db/schema";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Trash2,
  CreditCard,
  Tag,
  Search,
  Download,
  Filter,
  X,
  FileSpreadsheet,
} from "lucide-react";

interface EnrichedTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  date: Date;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  account?: { name: string; color: string } | null;
  toAccount?: { name: string; color: string } | null;
  category?: { name: string; color: string; icon: string } | null;
}

interface TransactionsListProps {
  transactions: EnrichedTransaction[];
  accounts?: Account[];
  categories?: Category[];
}

export function TransactionsList({
  transactions,
  accounts = [],
  categories = [],
}: TransactionsListProps) {
  const [isPending, startTransition] = useTransition();

  // Состояние фильтрации
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
    }).format(new Date(date));
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить эту операцию? Баланс счёта будет автоматически пересчитан.")) {
      startTransition(async () => {
        await deleteTransactionAction(id);
      });
    }
  };

  // Фильтрация транзакций
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Фильтр по типу
      if (typeFilter !== "all" && tx.type !== typeFilter) {
        return false;
      }

      // Фильтр по счёту
      if (accountFilter !== "all") {
        if (tx.accountId !== accountFilter && tx.toAccountId !== accountFilter) {
          return false;
        }
      }

      // Фильтр по категории
      if (categoryFilter !== "all") {
        if (tx.categoryId !== categoryFilter) {
          return false;
        }
      }

      // Поиск по описанию или названию категории / счёта
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const descMatch = tx.description?.toLowerCase().includes(query);
        const catMatch = tx.category?.name?.toLowerCase().includes(query);
        const accMatch = tx.account?.name?.toLowerCase().includes(query);
        const toAccMatch = tx.toAccount?.name?.toLowerCase().includes(query);

        if (!descMatch && !catMatch && !accMatch && !toAccMatch) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, accountFilter, categoryFilter, searchQuery]);

  const hasActiveFilters =
    searchQuery !== "" ||
    typeFilter !== "all" ||
    accountFilter !== "all" ||
    categoryFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setAccountFilter("all");
    setCategoryFilter("all");
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
      {/* Шапка: Заголовок и Экспорт */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              История операций
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
              {filteredTransactions.length}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Расходы, доходы и переводы с возможностью поиска
          </p>
        </div>

        <a
          href="/api/export/csv"
          download
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors self-start sm:self-auto cursor-pointer"
          title="Экспорт всех операций в Excel / CSV"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          <span>Экспорт в CSV</span>
        </a>
      </div>

      {/* Панель поиска и фильтров */}
      <div className="space-y-3">
        {/* Строка поиска */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по описанию, категории или счёту..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-neutral-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Быстрые фильтры */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Тип операции */}
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === "all"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setTypeFilter("expense")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === "expense"
                  ? "bg-red-500 text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              Расходы
            </button>
            <button
              onClick={() => setTypeFilter("income")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === "income"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              Доходы
            </button>
            <button
              onClick={() => setTypeFilter("transfer")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                typeFilter === "transfer"
                  ? "bg-blue-500 text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              Переводы
            </button>
          </div>

          {/* Фильтр по счетам */}
          {accounts.length > 0 && (
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-0 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Все счета</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          )}

          {/* Фильтр по категориям */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-0 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Все категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-neutral-400 hover:text-red-500 flex items-center gap-1 ml-auto cursor-pointer"
            >
              <X className="h-3 w-3" />
              <span>Сбросить фильтры</span>
            </button>
          )}
        </div>
      </div>

      {/* Список транзакций */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-800">
          <Tag className="h-8 w-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            {hasActiveFilters
              ? "Ни одной операции не найдено по вашим фильтрам"
              : "Пока нет ни одной операции"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {filteredTransactions.map((tx) => {
            const isExpense = tx.type === "expense";
            const isIncome = tx.type === "income";
            const isTransfer = tx.type === "transfer";

            return (
              <div
                key={tx.id}
                className="group flex items-center justify-between py-3.5 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 -mx-2 px-2 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Иконка типа */}
                  <div
                    className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center font-bold ${
                      isExpense
                        ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                        : isIncome
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                        : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {isExpense && <ArrowDownLeft className="h-4 w-4" />}
                    {isIncome && <ArrowUpRight className="h-4 w-4" />}
                    {isTransfer && <ArrowRightLeft className="h-4 w-4" />}
                  </div>

                  {/* Описание / Категория / Счёт */}
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {isTransfer
                          ? `Перевод: ${tx.account?.name || "Счёт"} → ${tx.toAccount?.name || "Счёт"}`
                          : tx.category?.name || tx.description || "Без категории"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {tx.account?.name || "Счёт"}
                      </span>
                      {tx.description && !isTransfer && (
                        <>
                          <span>•</span>
                          <span className="italic truncate">{tx.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Сумма и кнопка удаления */}
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold tracking-tight ${
                        isExpense
                          ? "text-red-600 dark:text-red-400"
                          : isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isExpense ? "-" : isIncome ? "+" : ""}
                      {formatMoney(tx.amount)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 p-1.5 rounded-lg transition-all cursor-pointer"
                    title="Удалить операцию"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
