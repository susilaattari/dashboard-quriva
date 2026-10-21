'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= 0) return null;

  const fromItem = (currentPage - 1) * pageSize + 1;
  const toItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers();
  const iconButtonClasses =
    'inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-10';

  return (
    <nav
      aria-label="Paginasi"
      className={`flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-4 text-xs text-slate-600 select-none sm:flex-row sm:px-6 ${className}`}
    >
      <div className="font-medium text-slate-500" aria-live="polite">
        Menampilkan <span className="font-bold text-slate-800">{fromItem}</span> -{' '}
        <span className="font-bold text-slate-800">{toItem}</span> dari{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> data
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Halaman pertama"
          className={iconButtonClasses}
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Halaman sebelumnya"
          className={iconButtonClasses}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} aria-hidden="true" className="px-1.5 py-1 text-slate-400">
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                type="button"
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum)}
                aria-label={`Halaman ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex h-11 min-w-[44px] items-center justify-center rounded-lg px-2.5 font-bold transition-all sm:h-10 sm:min-w-[40px] ${
                  isActive
                    ? 'border border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Halaman berikutnya"
          className={iconButtonClasses}
        >
          <ChevronRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Halaman terakhir"
          className={iconButtonClasses}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </nav>
  );
}
