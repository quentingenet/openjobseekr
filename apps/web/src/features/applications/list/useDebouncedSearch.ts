import { useEffect, useRef, useState } from 'react';

/**
 * Text input mirrored to an external value (the URL) after a pause in typing.
 * Follows the external value when it changes elsewhere (nav link, back button).
 */
export function useDebouncedSearch(
  externalValue: string,
  commit: (value: string) => void,
  delayMs = 300,
) {
  const [value, setValue] = useState(externalValue);
  const [syncedExternal, setSyncedExternal] = useState(externalValue);
  if (externalValue !== syncedExternal) {
    setSyncedExternal(externalValue);
    setValue(externalValue);
  }

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onChange = (next: string) => {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next.trim()), delayMs);
  };
  const cancel = () => clearTimeout(timer.current);

  return { value, onChange, cancel };
}
