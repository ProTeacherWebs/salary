"use server";

import { z } from "zod";
import { db } from "@/db";
import { accounts, categories, transactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureUserInitialized } from "@/db/seed";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ----------------------------------------------------
// Schemas
// ----------------------------------------------------

const accountSchema = z.object({
  name: z.string().trim().min(1, "Введите название счёта"),
  type: z.enum(["card", "cash", "bank", "savings"]),
  balance: z.coerce.number(),
  currency: z.string().default("RUB"),
  color: z.string().default("#3b82f6"),
});

const categorySchema = z.object({
  name: z.string().trim().min(1, "Введите название категории"),
  type: z.enum(["expense", "income"]),
  icon: z.string().default("Tag"),
  color: z.string().default("#ef4444"),
});

const transactionSchema = z.object({
  accountId: z.string().min(1, "Выберите счёт"),
  toAccountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  type: z.enum(["expense", "income", "transfer"]),
  description: z.string().trim().optional(),
  date: z.string().optional(), // YYYY-MM-DD
});

// ----------------------------------------------------
// Data fetching
// ----------------------------------------------------

export async function getFinancialData() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Убедимся, что у пользователя созданы дефолтные счета и категории
  await ensureUserInitialized(user.id);

  // Счета
  const userAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, user.id))
    .orderBy(desc(accounts.createdAt));

  // Категории
  const userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id))
    .orderBy(categories.name);

  // Последние 30 транзакций
  const userTransactions = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      date: transactions.date,
      accountId: transactions.accountId,
      toAccountId: transactions.toAccountId,
      categoryId: transactions.categoryId,
    })
    .from(transactions)
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(30);

  // Обогащаем транзакции названиями счетов и категорий
  const accountMap = new Map(userAccounts.map((a) => [a.id, a]));
  const categoryMap = new Map(userCategories.map((c) => [c.id, c]));

  const enrichedTransactions = userTransactions.map((tx) => ({
    ...tx,
    account: accountMap.get(tx.accountId),
    toAccount: tx.toAccountId ? accountMap.get(tx.toAccountId) : null,
    category: tx.categoryId ? categoryMap.get(tx.categoryId) : null,
  }));

  // Расчет суммарного баланса
  const totalBalance = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Расчет доходов и расходов за текущий месяц
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        gte(transactions.date, startOfMonth),
        lte(transactions.date, endOfMonth)
      )
    );

  const monthlyIncome = monthTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthlyExpense = monthTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    accounts: userAccounts,
    categories: userCategories,
    transactions: enrichedTransactions,
    stats: {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netSavings: monthlyIncome - monthlyExpense,
    },
  };
}

export type AnalyticsPeriod = "current_month" | "last_month" | "last_30_days" | "all_time";

export async function getAnalyticsData(period: AnalyticsPeriod = "current_month") {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id));

  const categoryMap = new Map(userCategories.map((c) => [c.id, c]));

  // Определение временных границ периода
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (period === "current_month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (period === "last_month") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (period === "last_30_days") {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    endDate = new Date();
  }

  // Запрос операций
  const conditions = [eq(transactions.userId, user.id)];
  if (startDate && endDate) {
    conditions.push(gte(transactions.date, startDate));
    conditions.push(lte(transactions.date, endDate));
  }

  const txList = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(transactions.date);

  // 1. Агрегация по категориям для расходов
  const expenseCatMap = new Map<string, number>();
  // 2. Агрегация по категориям для доходов
  const incomeCatMap = new Map<string, number>();
  // 3. Агрегация по дням для графика динамики
  const dailyMap = new Map<string, { income: number; expense: number }>();

  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of txList) {
    const dayKey = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
    }).format(new Date(tx.date));

    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, { income: 0, expense: 0 });
    }
    const dayStat = dailyMap.get(dayKey)!;

    if (tx.type === "expense") {
      totalExpense += tx.amount;
      const catId = tx.categoryId || "uncategorized";
      expenseCatMap.set(catId, (expenseCatMap.get(catId) || 0) + tx.amount);
      dayStat.expense += tx.amount;
    } else if (tx.type === "income") {
      totalIncome += tx.amount;
      const catId = tx.categoryId || "uncategorized";
      incomeCatMap.set(catId, (incomeCatMap.get(catId) || 0) + tx.amount);
      dayStat.income += tx.amount;
    }
  }

  // Формируем список структуры расходов
  const expensesByCategory = Array.from(expenseCatMap.entries())
    .map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      return {
        id: catId,
        name: cat ? cat.name : "Без категории",
        value: amount,
        color: cat?.color || "#94a3b8",
        icon: cat?.icon || "Tag",
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Формируем динамику по дням
  const timeline = Array.from(dailyMap.entries()).map(([date, vals]) => ({
    date,
    income: vals.income,
    expense: vals.expense,
  }));

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  return {
    period,
    summary: {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
    },
    expensesByCategory,
    timeline,
  };
}

// ----------------------------------------------------
// Accounts CRUD
// ----------------------------------------------------

export async function createAccountAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Не авторизован" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    currency: formData.get("currency") || "RUB",
    color: formData.get("color") || "#3b82f6",
  };

  const parsed = accountSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.insert(accounts).values({
      userId: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      balance: parsed.data.balance,
      currency: parsed.data.currency,
      color: parsed.data.color,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Create account error:", error);
    return { error: "Не удалось создать счёт" };
  }
}

export async function deleteAccountAction(accountId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Не авторизован" };

  try {
    await db
      .delete(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)));
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { error: "Не удалось удалить счёт" };
  }
}

// ----------------------------------------------------
// Categories CRUD
// ----------------------------------------------------

export async function createCategoryAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Не авторизован" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    icon: formData.get("icon") || "Tag",
    color: formData.get("color") || "#ef4444",
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.insert(categories).values({
      userId: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
      color: parsed.data.color,
      isDefault: false,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Create category error:", error);
    return { error: "Не удалось создать категорию" };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Не авторизован" };

  try {
    await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, user.id)));
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete category error:", error);
    return { error: "Не удалось удалить категорию" };
  }
}

// ----------------------------------------------------
// Transactions Actions
// ----------------------------------------------------

export async function createTransactionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Не авторизован" };

  const raw = {
    accountId: formData.get("accountId"),
    toAccountId: formData.get("toAccountId") || null,
    categoryId: formData.get("categoryId") || null,
    amount: formData.get("amount"),
    type: formData.get("type"),
    description: formData.get("description") || undefined,
    date: formData.get("date") || undefined,
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { accountId, toAccountId, categoryId, amount, type, description, date } = parsed.data;

  try {
    const txDate = date ? new Date(date) : new Date();

    // 1. Проверяем наличие основного счёта
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)))
      .limit(1);

    if (!account) {
      return { error: "Выбранный счёт не найден" };
    }

    // 2. Вставляем операцию
    await db.insert(transactions).values({
      userId: user.id,
      accountId,
      toAccountId: type === "transfer" ? toAccountId : null,
      categoryId: type === "transfer" ? null : categoryId,
      amount,
      type,
      description: description || null,
      date: txDate,
    });

    // 3. Обновляем баланс счетов
    if (type === "expense") {
      await db
        .update(accounts)
        .set({ balance: account.balance - amount, updatedAt: new Date() })
        .where(eq(accounts.id, account.id));
    } else if (type === "income") {
      await db
        .update(accounts)
        .set({ balance: account.balance + amount, updatedAt: new Date() })
        .where(eq(accounts.id, account.id));
    } else if (type === "transfer" && toAccountId) {
      const [toAccount] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, toAccountId), eq(accounts.userId, user.id)))
        .limit(1);

      if (toAccount) {
        await db
          .update(accounts)
          .set({ balance: account.balance - amount, updatedAt: new Date() })
          .where(eq(accounts.id, account.id));

        await db
          .update(accounts)
          .set({ balance: toAccount.balance + amount, updatedAt: new Date() })
          .where(eq(accounts.id, toAccount.id));
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Create transaction error:", error);
    return { error: "Не удалось сохранить операцию" };
  }
}

export async function deleteTransactionAction(transactionId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Не авторизован" };

  try {
    const [tx] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
      .limit(1);

    if (!tx) {
      return { error: "Операция не найдена" };
    }

    // Откатываем баланс
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, tx.accountId))
      .limit(1);

    if (account) {
      if (tx.type === "expense") {
        await db
          .update(accounts)
          .set({ balance: account.balance + tx.amount, updatedAt: new Date() })
          .where(eq(accounts.id, account.id));
      } else if (tx.type === "income") {
        await db
          .update(accounts)
          .set({ balance: account.balance - tx.amount, updatedAt: new Date() })
          .where(eq(accounts.id, account.id));
      } else if (tx.type === "transfer" && tx.toAccountId) {
        const [toAccount] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, tx.toAccountId))
          .limit(1);

        await db
          .update(accounts)
          .set({ balance: account.balance + tx.amount, updatedAt: new Date() })
          .where(eq(accounts.id, account.id));

        if (toAccount) {
          await db
            .update(accounts)
            .set({ balance: toAccount.balance - tx.amount, updatedAt: new Date() })
            .where(eq(accounts.id, toAccount.id));
        }
      }
    }

    // Удаляем операцию
    await db.delete(transactions).where(eq(transactions.id, transactionId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete transaction error:", error);
    return { error: "Не удалось удалить операцию" };
  }
}

