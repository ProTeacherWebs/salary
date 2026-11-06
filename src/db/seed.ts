import { db } from "./index";
import { accounts, categories } from "./schema";
import { eq } from "drizzle-orm";

export const DEFAULT_ACCOUNTS = [
  {
    name: "Основная карта",
    type: "card",
    balance: 0,
    currency: "RUB",
    color: "#3b82f6", // Blue
  },
  {
    name: "Наличные",
    type: "cash",
    balance: 0,
    currency: "RUB",
    color: "#10b981", // Emerald
  },
  {
    name: "Накопительный счёт",
    type: "savings",
    balance: 0,
    currency: "RUB",
    color: "#8b5cf6", // Purple
  },
];

export const DEFAULT_CATEGORIES = [
  // Расходы
  { name: "Продукты и супермаркеты", type: "expense", icon: "ShoppingBag", color: "#ef4444" },
  { name: "Кафе и рестораны", type: "expense", icon: "Utensils", color: "#f97316" },
  { name: "Транспорт и такси", type: "expense", icon: "Car", color: "#f59e0b" },
  { name: "Жилье и ЖКХ", type: "expense", icon: "Home", color: "#8b5cf6" },
  { name: "Здоровье и аптеки", type: "expense", icon: "HeartPulse", color: "#ec4899" },
  { name: "Развлечения и досуг", type: "expense", icon: "Film", color: "#06b6d4" },
  { name: "Одежда и покупки", type: "expense", icon: "Shirt", color: "#6366f1" },
  { name: "Подписки и сервисы", type: "expense", icon: "CreditCard", color: "#3b82f6" },
  { name: "Прочее", type: "expense", icon: "MoreHorizontal", color: "#64748b" },

  // Доходы
  { name: "Зарплата", type: "income", icon: "Briefcase", color: "#10b981" },
  { name: "Премия и бонусы", type: "income", icon: "Gift", color: "#14b8a6" },
  { name: "Подработка / Фриланс", type: "income", icon: "Laptop", color: "#84cc16" },
  { name: "Инвестиции и проценты", type: "income", icon: "TrendingUp", color: "#22c55e" },
  { name: "Прочий доход", type: "income", icon: "Wallet", color: "#059669" },
];

/**
 * Инициализирует базовые счета и категории для пользователя
 */
export async function seedDefaultUserData(userId: string) {
  try {
    // Создаем базовые счета
    for (const acc of DEFAULT_ACCOUNTS) {
      await db.insert(accounts).values({
        userId,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        currency: acc.currency,
        color: acc.color,
      });
    }

    // Создаем базовые категории
    for (const cat of DEFAULT_CATEGORIES) {
      await db.insert(categories).values({
        userId,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      });
    }
  } catch (error) {
    console.error("Error seeding default user data:", error);
    throw error;
  }
}

/**
 * Проверяет, есть ли у пользователя счета и категории.
 * Если нет (например, зарегистрировался до добавления таблиц) — инициализирует их.
 */
export async function ensureUserInitialized(userId: string) {
  const existingAccounts = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .limit(1);

  if (existingAccounts.length === 0) {
    await seedDefaultUserData(userId);
  }
}

