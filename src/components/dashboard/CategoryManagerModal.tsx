"use client";

import { useState, useTransition } from "react";
import { Category } from "@/db/schema";
import { createCategoryAction, deleteCategoryAction } from "@/app/actions/finance";
import {
  Tag,
  Plus,
  Trash2,
  X,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

interface CategoryManagerModalProps {
  categories: Category[];
}

export function CategoryManagerModal({ categories }: CategoryManagerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("type", activeTab);

    startTransition(async () => {
      const res = await createCategoryAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        form.reset();
      }
    });
  };

  const handleDelete = (categoryId: string, categoryName: string) => {
    if (confirm(`Удалить категорию "${categoryName}"? Операции в этой категории останутся, но станут "Без категории".`)) {
      startTransition(async () => {
        await deleteCategoryAction(categoryId);
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Управление категориями</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Категории операций
                  </h3>
                  <p className="text-xs text-neutral-500">Добавление и удаление статей трат и доходов</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Вкладки: Расходы / Доходы */}
            <div className="grid grid-cols-2 gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("expense")}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === "expense"
                    ? "bg-red-500 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                Расходы ({categories.filter((c) => c.type === "expense").length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("income")}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === "income"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                Доходы ({categories.filter((c) => c.type === "income").length})
              </button>
            </div>

            {/* Форма добавления новой категории */}
            <form onSubmit={handleCreate} className="space-y-3 shrink-0 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700/60">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                Новая категория ({activeTab === "expense" ? "расход" : "доход"})
              </span>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  name="name"
                  required
                  placeholder="Название (например: Спортзал, Курсы)"
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <input
                  name="color"
                  type="color"
                  defaultValue={activeTab === "expense" ? "#ef4444" : "#10b981"}
                  className="h-8 w-10 shrink-0 rounded cursor-pointer border-0 bg-transparent"
                  title="Выберите цвет категории"
                />

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Добавить</span>
                </button>
              </div>
            </form>

            {/* Список категорий */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {cat.name}
                    </span>
                    {cat.isDefault && (
                      <span className="text-[10px] text-neutral-400 bg-neutral-200/60 dark:bg-neutral-700/60 px-1.5 py-0.5 rounded-md">
                        Базовая
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 p-1 transition-all cursor-pointer"
                    title="Удалить категорию"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

