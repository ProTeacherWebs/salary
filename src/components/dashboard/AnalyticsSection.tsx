"use client";

import { useState, useEffect, useTransition } from "react";
import {
  getAnalyticsData,
  AnalyticsPeriod,
} from "@/app/actions/finance";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  PieChart as PieIcon,
  TrendingUp,
  Calendar,
  Percent,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
} from "lucide-react";

interface AnalyticsSectionProps {
  initialData: Awaited<ReturnType<typeof getAnalyticsData>>;
}

export function AnalyticsSection({ initialData }: AnalyticsSectionProps) {
  const [data, setData] = useState(initialData);
  const [period, setPeriod] = useState<AnalyticsPeriod>("current_month");
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePeriodChange = (newPeriod: AnalyticsPeriod) => {
    setPeriod(newPeriod);
    startTransition(async () => {
      const res = await getAnalyticsData(newPeriod);
      setData(res);
    });
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const hasExpenses = data.expensesByCategory.length > 0;
  const hasTimeline = data.timeline.length > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
      {/* Заголовок и селектор периода */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <PieIcon className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Аналитика и Графики
            </h2>
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Структура расходов по категориям и динамика финансов
          </p>
        </div>

        {/* Переключатель периода */}
        <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-xs font-semibold self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => handlePeriodChange("current_month")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              period === "current_month"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            Этот месяц
          </button>
          <button
            onClick={() => handlePeriodChange("last_month")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              period === "last_month"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            Прошлый месяц
          </button>
          <button
            onClick={() => handlePeriodChange("last_30_days")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              period === "last_30_days"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            30 дней
          </button>
          <button
            onClick={() => handlePeriodChange("all_time")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              period === "all_time"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            Всё время
          </button>
        </div>
      </div>

      {/* Быстрые метрики периода */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800/80">
        <div>
          <span className="text-[11px] text-neutral-400 block">Доходы за период</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            +{formatMoney(data.summary.totalIncome)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-neutral-400 block">Расходы за период</span>
          <span className="text-sm font-bold text-red-600 dark:text-red-400">
            -{formatMoney(data.summary.totalExpense)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-neutral-400 block">Дельта периода</span>
          <span
            className={`text-sm font-bold ${
              data.summary.netSavings >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {data.summary.netSavings >= 0 ? "+" : ""}
            {formatMoney(data.summary.netSavings)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-neutral-400 block">Норма сбережений</span>
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
            {data.summary.savingsRate}%
          </span>
        </div>
      </div>

      {/* Сетка двух графиков */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* График 1: Круговая диаграмма расходов */}
        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Расходы по категориям
            </h3>
            <span className="text-xs text-neutral-400">
              Всего: {formatMoney(data.summary.totalExpense)}
            </span>
          </div>

          {!mounted ? (
            <div className="h-56 flex items-center justify-center text-xs text-neutral-400">
              Загрузка графика...
            </div>
          ) : !hasExpenses ? (
            <div className="h-56 flex flex-col items-center justify-center text-center px-4">
              <PieIcon className="h-8 w-8 text-neutral-300 dark:text-neutral-600 mb-1" />
              <p className="text-xs font-semibold text-neutral-500">Нет расходов за выбранный период</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Donut Chart */}
              <div className="w-full sm:w-1/2 h-52 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expensesByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {data.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatMoney(Number(value) || 0), "Сумма"]}
                      contentStyle={{
                        borderRadius: "1rem",
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Топ-Категории */}
              <div className="w-full sm:w-1/2 space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {data.expensesByCategory.slice(0, 5).map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 ml-2">
                        {cat.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* График 2: Динамика доходов и расходов */}
        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Динамика доходов и расходов
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Доход
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Расход
              </span>
            </div>
          </div>

          {!mounted ? (
            <div className="h-56 flex items-center justify-center text-xs text-neutral-400">
              Загрузка графика...
            </div>
          ) : !hasTimeline ? (
            <div className="h-56 flex flex-col items-center justify-center text-center px-4">
              <TrendingUp className="h-8 w-8 text-neutral-300 dark:text-neutral-600 mb-1" />
              <p className="text-xs font-semibold text-neutral-500">Нет операций за выбранный период</p>
            </div>
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.timeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#888" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#888" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatMoney(Number(value) || 0),
                      name === "income" ? "Доход" : "Расход",
                    ]}
                    contentStyle={{
                      borderRadius: "1rem",
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

