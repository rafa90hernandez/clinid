'use client';
import { type ComponentProps } from 'react';

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={`w-full max-w-sm bg-white rounded-xl2 shadow-soft p-6 ${className}`}
      {...props}
    />
  );
}

export function Label({ className = '', ...props }: ComponentProps<'label'>) {
  return (
    <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props} />
  );
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400 ${className}`}
      {...props}
    />
  );
}

export function Button({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={`w-full rounded-lg bg-brand-500 text-white font-medium py-2.5 hover:bg-brand-600 transition ${className}`}
      {...props}
    />
  );
}

export function Helper({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500 mt-1">{children}</p>;
}
