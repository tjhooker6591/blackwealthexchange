import React from "react";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      {...props}
      className={`bwe-shell-panel rounded-[var(--radius-panel)] p-5 text-[var(--foreground)] ${className || ""}`}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div {...props} className={`p-1 ${className || ""}`}>
      {children}
    </div>
  );
};

export default Card;
