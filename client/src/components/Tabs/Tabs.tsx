import type { TabsProps } from "./Tabs.types";

const Tabs = ({ tabs, value, onChange, ariaLabel, className }: TabsProps) => {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex max-w-full self-center w-fit items-center gap-1 overflow-x-auto rounded-full bg-fairway-100 p-1 ${className ?? ""}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors cursor-pointer ${
              isActive
                ? "bg-white font-semibold text-fairway-800 shadow-sm"
                : "font-medium text-ink-muted hover:text-fairway-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
