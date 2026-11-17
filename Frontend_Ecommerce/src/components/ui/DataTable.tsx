import React from 'react';
import { cn } from '../../utils/cn';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found',
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-obsidian-surface-1 rounded-xl border border-lavender-mist dark:border-obsidian-border p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-electric-violet border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-ink-muted">Loading table data...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full bg-white dark:bg-obsidian-surface-1 rounded-xl border border-lavender-mist dark:border-obsidian-border shadow-sm overflow-hidden',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-porcelain dark:bg-obsidian-surface-2 border-b border-lavender-mist dark:border-obsidian-border text-ink-muted dark:text-text-dark-muted text-xs font-semibold uppercase tracking-wider">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={cn(
                    'py-3.5 px-4 whitespace-nowrap',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-lavender-mist dark:divide-obsidian-border text-sm text-ink dark:text-text-dark-primary">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-ink-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-porcelain/60 dark:hover:bg-obsidian-surface-2/60 transition-colors"
                >
                  {columns.map((col, colIndex) => {
                    const value = col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? (row[col.accessorKey] as unknown as React.ReactNode)
                      : null;
                    return (
                      <td
                        key={colIndex}
                        className={cn(
                          'py-3.5 px-4',
                          col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left',
                          col.className
                        )}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

