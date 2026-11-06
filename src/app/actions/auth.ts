"use server";

import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
} from "@/lib/auth";
import { seedDefaultUserData } from "@/db/seed";
import { redirect } from "next/navigation";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Имя должно содержать минимум 2 символа"),
    email: z.string().trim().email("Укажите корректный адрес эл. почты").toLowerCase(),
    password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().trim().email("Укажите корректный email").toLowerCase(),
  password: z.string().min(1, "Введите пароль"),
});

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function registerAction(
  prevState: AuthFormState | null,
  formData: FormData
): Promise<AuthFormState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = registerSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validation.data;

  try {
    // Проверка на существование пользователя
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return {
        error: "Пользователь с таким email уже зарегистрирован",
      };
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
      })
      .returning({ id: users.id });

    if (!newUser) {
      return {
        error: "Не удалось создать учетную запись. Попробуйте еще раз.",
      };
    }

    // Инициализируем стандартные категории и счета для нового пользователя
    await seedDefaultUserData(newUser.id);

    await createSession(newUser.id);
  } catch (error) {
    console.error("Register error:", error);
    return {
      error: "Произошла ошибка при регистрации. Пожалуйста, повторите позже.",
    };
  }

  redirect("/dashboard");
}

export async function loginAction(
  prevState: AuthFormState | null,
  formData: FormData
): Promise<AuthFormState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return {
        error: "Неверный email или пароль",
      };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return {
        error: "Неверный email или пароль",
      };
    }

    await createSession(user.id);
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: "Ошибка авторизации. Попробуйте еще раз.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
