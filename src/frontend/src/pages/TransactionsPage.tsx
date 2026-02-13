import { useState, useMemo } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Receipt, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/useQueries';
import { format } from 'date-fns';
import { useEffect } from 'react';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { showLatest?: string };
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: transactions, isLoading } = useTransactions();

  // Show latest receipt if coming from checkout
  useEffect(() => {
    if (search.showLatest === 'true' && transactions && transactions.length > 0) {
      const latest = transactions[0];
      navigate({ to: `/receipt/${latest.id.toString()}` });
    }
  }, [search.showLatest, transactions, navigate]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = [...transactions];

    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter((t) => Number(t.timestamp) / 1_000_000 >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime() + 86400000; // Add 1 day
      filtered = filtered.filter((t) => Number(t.timestamp) / 1_000_000 < end);
    }

    return filtered;
  }, [transactions, startDate, endDate]);

  const handleViewReceipt = (transactionId: bigint) => {
    navigate({ to: `/receipt/${transactionId.toString()}` });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h2 className="text-2xl font-bold text-foreground">Riwayat Transaksi</h2>
        <p className="text-sm text-muted-foreground">Lihat dan kelola transaksi sebelumnya</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="mb-6 flex gap-4 items-end">
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium text-foreground mb-2 block">Tanggal Mulai</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium text-foreground mb-2 block">Tanggal Akhir</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  Hapus Filter
                </Button>
              )}
            </div>

            {/* Transactions Table */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Receipt className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">Transaksi tidak ditemukan</p>
                <p className="text-muted-foreground text-sm">Selesaikan penjualan untuk melihat transaksi di sini</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Transaksi</TableHead>
                      <TableHead>Tanggal & Waktu</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Metode Pembayaran</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const date = new Date(Number(transaction.timestamp) / 1_000_000);
                      
                      return (
                        <TableRow key={transaction.id.toString()}>
                          <TableCell className="font-mono text-sm">
                            #{transaction.id.toString().padStart(6, '0')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{format(date, 'dd MMM yyyy')}</span>
                              <span className="text-xs text-muted-foreground">{format(date, 'HH:mm:ss')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{transaction.items.length} item</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-[oklch(0.65_0.18_30)]">
                            Rp {Number(transaction.totalAmount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceipt(transaction.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
