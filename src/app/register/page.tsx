import { RegisterForm } from "@/components/auth/RegisterForm";
import { Wallet } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация | Трекер трат",
  description: "Создайте профиль для учёта личных финансов и аналитики трат",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-1 ring-emerald-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Создать аккаунт
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Начните вести учет финансов и анализировать расходы
            </p>
          </div>

          <RegisterForm />
        </div>

        <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-6">
          Безопасное хранение данных в Turso DB
        </p>
      </div>
    </div>
  );
}
