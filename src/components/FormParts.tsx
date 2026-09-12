/**
 * 訂購表單的共用小元件：數量選擇器、欄位外框與輸入框樣式。
 * 主訂購表單（OrderForm）與南大附中專屬表單（NdaOrderForm）共用，樣式才不會走樣。
 */
import React from 'react';
import { Minus, Plus, AlertTriangle } from 'lucide-react';

export const Stepper = ({
  value, onChange, min = 0, max = 99, label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
}) => (
  <div className="flex items-center gap-1 bg-stone-900 rounded-xl border border-white/15 p-1">
    <button
      type="button"
      aria-label={`減少${label}`}
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-stone-300 hover:bg-stone-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
    >
      <Minus size={16} />
    </button>
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        onChange(Number.isNaN(n) ? min : Math.min(max, Math.max(min, n)));
      }}
      className="w-10 sm:w-12 bg-transparent text-center text-lg font-bold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <button
      type="button"
      aria-label={`增加${label}`}
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-stone-300 hover:bg-amber-600 hover:text-stone-950 disabled:opacity-30 transition-colors"
    >
      <Plus size={16} />
    </button>
  </div>
);

export const Field = ({
  id, label, required, error, hint, children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-bold text-stone-200 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
      {hint && <span className="font-normal text-stone-400 text-xs ml-2">{hint}</span>}
    </label>
    {children}
    {error && (
      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
        <AlertTriangle size={12} /> {error}
      </p>
    )}
  </div>
);

export const inputClass =
  'w-full bg-stone-900 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-stone-500 outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40 transition-colors aria-[invalid=true]:border-red-500/70 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-500/30';
