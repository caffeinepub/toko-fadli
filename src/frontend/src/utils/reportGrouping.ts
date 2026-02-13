import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import type { Transaction } from '@/backend';

export interface ReportPeriod {
  period: string;
  total: number;
  transactionCount: number;
}

export function groupTransactionsByPeriod(
  transactions: Transaction[],
  period: 'daily' | 'weekly' | 'monthly'
): ReportPeriod[] {
  const groups = new Map<string, { total: number; count: number }>();

  transactions.forEach((transaction) => {
    const date = new Date(Number(transaction.timestamp) / 1_000_000);
    let key: string;

    switch (period) {
      case 'daily':
        key = format(startOfDay(date), 'yyyy-MM-dd');
        break;
      case 'weekly':
        key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'monthly':
        key = format(startOfMonth(date), 'yyyy-MM');
        break;
    }

    const existing = groups.get(key) || { total: 0, count: 0 };
    groups.set(key, {
      total: existing.total + Number(transaction.totalAmount),
      count: existing.count + 1,
    });
  });

  const result: ReportPeriod[] = [];
  groups.forEach((value, key) => {
    let periodLabel: string;
    
    switch (period) {
      case 'daily':
        periodLabel = format(new Date(key), 'EEEE, MMM dd, yyyy');
        break;
      case 'weekly':
        periodLabel = `Week of ${format(new Date(key), 'MMM dd, yyyy')}`;
        break;
      case 'monthly':
        periodLabel = format(new Date(key + '-01'), 'MMMM yyyy');
        break;
    }

    result.push({
      period: periodLabel,
      total: value.total,
      transactionCount: value.count,
    });
  });

  // Sort by period descending (most recent first)
  return result.sort((a, b) => b.period.localeCompare(a.period));
}
