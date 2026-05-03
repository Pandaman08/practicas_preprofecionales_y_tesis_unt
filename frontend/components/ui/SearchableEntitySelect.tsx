'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchableEntityOption {
  value: number;
  title: string;
  subtitle?: string;
  keywords?: string[];
}

interface SearchableEntitySelectProps {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  value?: number;
  options: SearchableEntityOption[];
  onChange: (value?: number) => void;
  error?: string;
  disabled?: boolean;
  helperText?: string;
  allowClear?: boolean;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function SearchableEntitySelect({
  label,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  value,
  options,
  onChange,
  error,
  disabled = false,
  helperText,
  allowClear = false,
}: Readonly<SearchableEntitySelectProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const haystack = normalizeText([
        option.title,
        option.subtitle || '',
        ...(option.keywords || []),
      ].join(' '));
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!disabled) setIsOpen((current) => !current);
          }}
          disabled={disabled}
          className={[
            'input-field flex w-full items-center justify-between gap-3 text-left',
            error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : '',
            disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : '',
          ].join(' ')}
        >
          <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
            {selectedOption ? selectedOption.title : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="input-field pl-9"
              />
            </div>

            {allowClear && selectedOption ? (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar seleccion
              </button>
            ) : null}

            <div className="mt-3 max-h-56 overflow-auto pr-1">
              {filteredOptions.length ? (
                <div className="space-y-1">
                  {filteredOptions.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          setIsOpen(false);
                        }}
                        className={[
                          'flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition',
                          isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <span>
                          <span className="block text-sm font-medium">{option.title}</span>
                          {option.subtitle ? (
                            <span className="mt-0.5 block text-xs text-slate-500">{option.subtitle}</span>
                          ) : null}
                        </span>
                        {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  {emptyMessage}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}