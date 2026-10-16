import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

const buttonStyles = {
  pine: "bg-pine text-cream hover:bg-pine/90",
  cream: "bg-cream text-ink shadow-card hover:bg-paper",
  ember: "bg-ember text-cream hover:bg-ember/90",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
} as const;

type Variant = keyof typeof buttonStyles;

export function buttonClass(variant: Variant = "pine", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors duration-200 disabled:opacity-50",
    buttonStyles[variant],
    className,
  );
}

export function Button({
  variant = "pine",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function Photo({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn(
        "h-full w-full object-cover outline outline-1 -outline-offset-1 outline-ink/10",
        className,
      )}
    />
  );
}

export function PageIntro({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 max-w-2xl">
      {kicker ? <p className="text-sm font-medium text-pine">{kicker}</p> : null}
      <h1 className="mt-1 font-display text-4xl tracking-tight text-ink md:text-5xl">{title}</h1>
      {children ? <div className="mt-3 text-muted">{children}</div> : null}
    </header>
  );
}

export function BackLink({
  to,
  label,
}: {
  to: "/sites" | "/trips" | "/kitchen";
  label: string;
}) {
  return (
    <Link
      to={to}
      className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted hover:text-ink"
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function Ring({ ratio, label }: { ratio: number; label: string }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, ratio)));
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 40 40" className="size-11 shrink-0" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-cream/30"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-ember"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="text-sm text-cream/90 tabular-nums">{label}</span>
    </div>
  );
}

export function Meter({ ratio }: { ratio: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
      <div
        className="h-full rounded-full bg-pine"
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}

const fieldClass =
  "h-11 w-full rounded-xl bg-paper px-3 text-ink ring-1 ring-ink/10 outline-none";

export function fieldClasses(className?: string) {
  return cn(fieldClass, className);
}
