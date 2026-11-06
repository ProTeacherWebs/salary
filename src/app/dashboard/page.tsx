import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { getFinancialData, getAnalyticsData } from "@/app/actions/finance";
import { redirect } from "next/navigation";
import { Wallet, LogOut } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { AccountsSection } from "@/components/dashboard/AccountsSection";
import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal";
import { TransactionsList } from "@/components/dashboard/TransactionsList";
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection";
import { CategoryManagerModal } from "@/components/dashboard/CategoryManagerModal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?clear=1");
  }

  // Загружаем финансовые данные и начальную аналитику за текущий месяц
  const [financialData, analyticsData] = await Promise.all([
    getFinancialData(),
    getAnalyticsData("current_month"),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-16">
      {/* Top Navigation */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight">Трекер Финансов</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Turso Edge
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold leading-tight">{user.name}</span>
              <span className="text-xs text-neutral-400">{user.email}</span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl text-neutral-600 hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Выйти из аккаунта"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Banner with Greeting & Add Transaction Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/10">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-200">
              Личный кабинет
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
              Привет, {user.name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
              Управляйте счетами, добавляйте доходы и расходы в один клик. Все изменения мгновенно синхронизируются.
            </p>
          </div>

          <div className="shrink-0">
            <AddTransactionModal
              accounts={financialData.accounts}
              categories={financialData.categories}
            />
          </div>
        </div>

        {/* Сводные KPI Карточки */}
        <StatsCards stats={financialData.stats} />

        {/* Аналитический блок с Recharts графиками */}
        <AnalyticsSection initialData={analyticsData} />

        {/* Главная сетка: Операции + Счета */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Левая колонка: Последние операции (2/3 ширины) */}
          <div className="lg:col-span-2 space-y-6">
            <TransactionsList
              transactions={financialData.transactions}
              accounts={financialData.accounts}
              categories={financialData.categories}
            />
          </div>

          {/* Правая колонка: Счета и быстрые действия (1/3 ширины) */}
          <div className="space-y-6">
            <AccountsSection accounts={financialData.accounts} />

            {/* Блок категорий инфо + управление */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Категории
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {financialData.categories.length} категорий
                  </p>
                </div>
                <CategoryManagerModal categories={financialData.categories} />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {financialData.categories.slice(0, 8).map((cat) => (
                  <span
                    key={cat.id}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                  >
                    {cat.name}
                  </span>
                ))}
                {financialData.categories.length > 8 && (
                  <span className="text-[11px] px-2 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-medium">
                    +{financialData.categories.length - 8} ещё
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
