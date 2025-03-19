import React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  return (
    <input
      ref={ref}
      {...props}
      className={`p-2 border rounded ${props.className ? props.className : ""}`}
    />
  );
});

Input.displayName = "Input";

export default Input;
