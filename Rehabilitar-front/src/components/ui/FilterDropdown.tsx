import { useState, useRef, useEffect } from "react";
import { Button } from "./Button";
interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterDropdownProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onApply: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  inline?: boolean;
  open?: boolean;
  children?: React.ReactNode;
}

export function FilterDropdown({
  filters,
  values,
  onChange,
  onApply,
  onOpenChange,
  inline,
  open,
  children,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const actualOpen = inline ? open : isOpen;

  useEffect(() => {
    if (!inline) {
      onOpenChange?.(isOpen);
    }
  }, [isOpen, onOpenChange, inline]);

  useEffect(() => {
    if (inline) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inline]);

  const panel = (
    <div className="flex flex-wrap items-end gap-4 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {filters.map((filter) => (
        <div key={filter.key} className="flex flex-col">
          <label className="text-sm font-medium text-dark dark:text-gray-100 mb-1">
            {filter.label}
          </label>
          <select
            value={values[filter.key]}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-dark dark:text-gray-100 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-w-40"
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {children}
      <div className="flex items-end ml-auto">
        <Button
          type="button"
          variant="primary"
          className="min-w-32"
          onClick={() => {
            onApply();
            if (!inline) setIsOpen(false);
          }}
        >
          Limpiar
        </Button>
      </div>
    </div>
  );

  if (inline) {
    return actualOpen ? panel : null;
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      <Button
        variant="primary"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border-none"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filtros
        <span className="text-lg font-medium">{isOpen ? '<' : '>'}</span>
      </Button>

        <span>Filtros</span>

        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M6 9l6 6 6-6"
          />
        </svg>
      </Button>

      {actualOpen && (
        <div className="absolute top-full mt-2 left-0 z-50">
          {panel}
        </div>
      )}
    </div>
  );
}
