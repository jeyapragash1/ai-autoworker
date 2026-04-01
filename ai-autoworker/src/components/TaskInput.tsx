"use client";

import { useState } from "react";

type TaskInputProps = {
  onSubmit: (value: string) => Promise<void>;
  isSubmitting: boolean;
  errorMessage?: string;
};

export function TaskInput({ onSubmit, isSubmitting, errorMessage }: TaskInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = async () => {
    const trimmed = value.trim();

    if (!trimmed || isSubmitting) {
      return;
    }

    await onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    await handleSubmit();
  };

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Describe your task..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="h-11 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-500"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-11 rounded-lg border border-zinc-600 bg-zinc-100 px-5 text-sm font-semibold text-zinc-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Running..." : "Run Task 🚀"}
        </button>
      </div>
      {errorMessage ? <p className="mt-3 text-sm text-red-400">{errorMessage}</p> : null}
    </section>
  );
}
