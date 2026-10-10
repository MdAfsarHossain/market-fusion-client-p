"use client";

import { useRef, useState, type ComponentProps } from "react";
import { Input, cn } from "@/components/ui";

// A password field with a show/hide toggle.
//
// Lives in its own client module rather than the ui barrel: the barrel is
// imported by server components, and a hook in there would force every one of
// them to become a client component.
export const PasswordInput = ({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) => {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const toggle = () => {
    const input = inputRef.current;
    const caret = input?.selectionStart ?? null;

    setVisible((current) => !current);

    // Swapping the input type drops focus and moves the caret to the start, so
    // put both back — otherwise revealing mid-typing loses your place.
    if (input) {
      requestAnimationFrame(() => {
        input.focus();
        if (caret !== null) {
          try {
            input.setSelectionRange(caret, caret);
          } catch {
            // Some browsers refuse setSelectionRange on certain input types
          }
        }
      });
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type={visible ? "text" : "password"}
        // Room for the button so long values never run underneath it
        className={cn("pr-11", className)}
        {...props}
      />

      <button
        type="button"
        onClick={toggle}
        // The field sits inside a <label>; a plain click here would otherwise
        // pull focus to the input before the toggle runs.
        onMouseDown={(event) => event.preventDefault()}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? (
          // Eye with a slash: currently visible, click to hide
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8"
              strokeLinecap="round"
            />
            <path
              d="M6.9 6.9C4.8 8.2 3.2 10 2.5 12c1.4 3.6 5.1 6 9.5 6 1.7 0 3.3-.4 4.7-1.1M17.6 15.6c1.4-1 2.5-2.2 3.1-3.6-1.4-3.6-5.1-6-9.5-6-.6 0-1.2 0-1.7.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              d="M2.5 12C3.9 8.4 7.6 6 12 6s8.1 2.4 9.5 6c-1.4 3.6-5.1 6-9.5 6s-8.1-2.4-9.5-6z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
        )}
      </button>
    </div>
  );
};
