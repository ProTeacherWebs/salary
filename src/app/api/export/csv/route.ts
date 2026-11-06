import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { transactions, accounts, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Загружаем все транзакции пользователя
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
    .orderBy(desc(transactions.date));

  // Загружаем счета и категории для сопоставления
  const [userAccounts, userCategories] = await Promise.all([
    db.select().from(accounts).where(eq(accounts.userId, user.id)),
    db.select().from(categories).where(eq(categories.userId, user.id)),
  ]);

  const accountMap = new Map(userAccounts.map((a) => [a.id, a]));
  const categoryMap = new Map(userCategories.map((c) => [c.id, c]));

  // Заголовки CSV
  const headers = [
    "ID",
    "Дата",
    "Тип операции",
    "Сумма (₽)",
    "Основной счёт",
    "Счёт зачисления (при переводе)",
    "Категория",
    "Комментарий",
  ];

  const escapeCSV = (field: any) => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = userTransactions.map((tx) => {
    const acc = accountMap.get(tx.accountId);
    const toAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : null;
    const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : null;

    const formattedDate = new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(tx.date));

    const typeLabel =
      tx.type === "expense"
        ? "Расход"
        : tx.type === "income"
        ? "Доход"
        : "Перевод";

    return [
      escapeCSV(tx.id),
      escapeCSV(formattedDate),
      escapeCSV(typeLabel),
      escapeCSV(tx.amount),
      escapeCSV(acc?.name || "Неизвестный счёт"),
      escapeCSV(toAcc?.name || ""),
      escapeCSV(cat?.name || ""),
      escapeCSV(tx.description || ""),
    ].join(";");
  });

  // UTF-8 BOM для правильного открытия в Excel
  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `finance_export_${todayStr}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

