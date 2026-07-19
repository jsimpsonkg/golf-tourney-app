export interface TabItem {
  /** Text shown on the pill. */
  label: string;
  /** Stable identifier reported back through `onChange` (e.g. a session id). */
  value: string;
}

export interface TabsProps {
  tabs: TabItem[];
  /** Currently active tab value — this is a controlled component. */
  value: string;
  onChange: (value: string) => void;
  /** Accessible label for the tablist, e.g. "Rounds". */
  ariaLabel?: string;
  /** Extra classes for the outer pill bar (layout/margins). */
  className?: string;
}
