import { useCallback, useState } from "react";

// Remembers which tab was last selected so navigating away and coming back
// doesn't dump you on the first round again — on singles day you want to land
// back on singles, not 2v2.
//
// Callers keep their own "is this still a real tab?" fallback (the usual
// `find(...) ?? sessions[0]`), which also covers a remembered id that no longer
// exists — a different tournament, a renamed round, a cleared season.

const KEY_PREFIX = "golf.tab.";

// localStorage throws in Safari private mode and when storage is disabled, and
// a remembered tab is never worth breaking a page over.
const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(KEY_PREFIX + key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    window.localStorage.setItem(KEY_PREFIX + key, value);
  } catch {
    // Ignore — the tab still switches, it just won't be remembered.
  }
};

export const readStickyTab = read;

// `key` should identify the tab group *and* what it belongs to, e.g.
// `rounds:${tournamentId}`, so two tournaments don't share a selection.
export const useStickyTab = (
  key: string,
): [string | null, (value: string) => void] => {
  // Read once on mount: this component re-mounts on navigation, which is
  // exactly when the remembered value needs picking back up.
  const [value, setValue] = useState<string | null>(() => read(key));

  const select = useCallback(
    (next: string) => {
      setValue(next);
      write(key, next);
    },
    [key],
  );

  return [value, select];
};
