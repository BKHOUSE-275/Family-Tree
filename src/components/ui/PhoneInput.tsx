"use client";

import type { ComponentProps, InputEvent } from "react";

/**
 * 5551234567 → 555-123-4567, and 15551234567 → 1-555-123-4567.
 * A dash only appears once a digit follows it, so backspacing never gets stuck.
 */
export function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  let prefix = "";
  if (digits.length > 10 && digits.startsWith("1")) {
    prefix = "1-";
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean);
  return prefix + groups.join("-");
}

const digitCount = (value: string) => value.replace(/\D/g, "").length;

/** Formats a saved number, unless that would drop digits (an extension, say). */
function formatSaved(value: string) {
  const formatted = formatPhone(value);
  return digitCount(formatted) === digitCount(value) ? formatted : value;
}

/** A telephone field that adds dashes as the number is typed. */
export function PhoneInput({
  defaultValue,
  onInput,
  ...props
}: Omit<ComponentProps<"input">, "type" | "defaultValue" | "value"> & {
  defaultValue?: string;
}) {
  function handleInput(event: InputEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = digitCount(input.value.slice(0, caret));
    const formatted = formatPhone(input.value);
    if (formatted !== input.value) {
      input.value = formatted;
      // Keep the cursor after the same digit, so edits mid-number don't jump to the end.
      let position = 0;
      for (let seen = 0; position < formatted.length && seen < digitsBeforeCaret; position += 1) {
        if (/\d/.test(formatted[position]!)) seen += 1;
      }
      input.setSelectionRange(position, position);
    }
    onInput?.(event);
  }

  return (
    <input
      type="tel"
      inputMode="tel"
      {...props}
      defaultValue={defaultValue ? formatSaved(defaultValue) : defaultValue}
      onInput={handleInput}
    />
  );
}
