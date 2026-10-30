/**
 * Field classes in a plain module so Server Components can read the strings;
 * anything exported from a 'use client' file reaches them as a reference.
 */
export const inputClass =
  'block w-full border border-black bg-white px-5 py-4 text-base leading-tight text-black placeholder:text-forest-400 aria-[invalid=true]:border-danger-700 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger-700 disabled:bg-cream-100';

export const labelTextClass = 'text-base font-medium text-black';
