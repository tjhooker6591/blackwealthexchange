import React from "react";

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      className={`bwe-focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--accent)] px-5 py-2.5 text-sm font-extrabold text-[var(--accent-ink)] shadow-[0_16px_30px_rgba(212,175,55,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${className ? className : ""}`}
    >
      {children}
    </button>
  );
};

export default Button;
