import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsPanel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/80 overflow-hidden">
      <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-black/[0.04]">
        <h2 className="text-base font-semibold text-brand-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-brand-ink/55 leading-relaxed">{description}</p>
        ) : null}
      </div>
      <div className="px-4 sm:px-6 py-5 space-y-5">{children}</div>
      {footer ? (
        <div className="px-4 sm:px-6 py-4 border-t border-black/[0.04] bg-brand-surface/30 sticky bottom-0 lg:static">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function SettingsFieldGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-4 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-brand-ink">{label}</span>
        {description ? (
          <span className="block text-xs text-brand-ink/50 mt-0.5 leading-relaxed">
            {description}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary/30"
      />
    </label>
  );
}

export function SettingsSaveButton({
  pending,
  label = "Save changes",
}: {
  pending: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60 transition-colors"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function SettingsComingSoon({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-brand-ink/45 italic border border-dashed border-black/[0.08] rounded-lg px-3 py-2">
      {children}
    </p>
  );
}
