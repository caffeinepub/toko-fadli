import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTransactions, useSettings, useProducts } from '@/hooks/useQueries';
import { ReceiptLayout } from '@/components/receipt/ReceiptLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReceiptPage() {
  const { transactionId } = useParams({ strict: false }) as { transactionId: string };
  const navigate = useNavigate();

  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: products } = useProducts();

  const transaction = transactions?.find((t) => t.id.toString() === transactionId);

  if (transactionsLoading || settingsLoading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b border-border bg-card px-6 py-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-96 w-96" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b border-border bg-card px-6 py-4">
          <Button variant="ghost" onClick={() => navigate({ to: '/transactions' })}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Transaksi
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Transaksi tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Hidden on print */}
      <div className="border-b border-border bg-card px-6 py-4 print:hidden">
        <Button variant="ghost" onClick={() => navigate({ to: '/transactions' })}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Transaksi
        </Button>
      </div>

      {/* Receipt */}
      <div className="flex-1 overflow-auto p-6 print:p-0">
        <ReceiptLayout
          transaction={transaction}
          settings={settings!}
          products={products || []}
        />
      </div>
    </div>
  );
}
