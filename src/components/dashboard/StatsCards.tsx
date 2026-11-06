import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    netSavings: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Общий баланс */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Общий баланс
          </span>
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            {formatMoney(stats.totalBalance)}
          </div>
          <p className="text-xs text-neutral-400 mt-1">По всем вашим счетам</p>
        </div>
      </div>

      {/* Доходы за месяц */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Доходы (в этом месяце)
          </span>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            +{formatMoney(stats.monthlyIncome)}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Зарплата, бонусы, поступления</p>
        </div>
      </div>

      {/* Расходы за месяц */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Расходы (в этом месяце)
          </span>
          <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">
            -{formatMoney(stats.monthlyExpense)}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Траты по всем категориям</p>
        </div>
      </div>

      {/* Чистая дельта / Сбережения */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Чистый остаток (дельта)
          </span>
          <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <PiggyBank className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl font-black tracking-tight ${
              stats.netSavings >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {stats.netSavings >= 0 ? "+" : ""}
            {formatMoney(stats.netSavings)}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Доходы минус расходы за месяц</p>
        </div>
      </div>
    </div>
  );
}

