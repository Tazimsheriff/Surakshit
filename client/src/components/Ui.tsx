import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary: "bg-ink text-bone hover:bg-[#1a120f] dark:bg-white dark:text-[#111] dark:hover:bg-[#e7e7e7]",
    secondary: "bg-[#efebe3] text-ink hover:bg-[#e4dfd4] dark:bg-[#262626] dark:text-[#f4f1ea] dark:hover:bg-[#303030]",
    ghost: "text-ink hover:bg-[#efebe3] dark:text-[#f4f1ea] dark:hover:bg-[#262626]",
  };
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={`rounded-lg border border-[#e4e0d8] bg-white p-5 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
