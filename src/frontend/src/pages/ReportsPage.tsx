import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/useQueries';
import { groupTransactionsByPeriod } from '@/utils/reportGrouping';

export default function ReportsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data: transactions, isLoading } = useTransactions();

  const reportData = useMemo(() => {
    if (!transactions) return [];
    return groupTransactionsByPeriod(transactions, period);
  }, [transactions, period]);

  const totalSales = useMemo(() => {
    if (!transactions) return 0;
    return transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
  }, [transactions]);

  const totalTransactions = transactions?.length || 0;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h2 className="text-2xl font-bold text-foreground">Laporan Penjualan</h2>
        <p className="text-sm text-muted-foreground">Lihat performa dan tren penjualan</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Penjualan</CardTitle>
              <TrendingUp className="w-4 h-4 text-[oklch(0.65_0.18_30)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                Rp {totalSales.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sepanjang waktu</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
              <BarChart3 className="w-4 h-4 text-[oklch(0.65_0.18_30)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground mt-1">Sepanjang waktu</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Transaksi</CardTitle>
              <Calendar className="w-4 h-4 text-[oklch(0.65_0.18_30)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                Rp {totalTransactions > 0 ? Math.round(totalSales / totalTransactions).toLocaleString() : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per transaksi</p>
            </CardContent>
          </Card>
        </div>

        {/* Period Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Periode</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
              <TabsList className="mb-6">
                <TabsTrigger value="daily">Harian</TabsTrigger>
                <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                <TabsTrigger value="monthly">Bulanan</TabsTrigger>
              </TabsList>

              <TabsContent value={period}>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Tidak ada data untuk periode ini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <h4 className="font-semibold text-foreground">{item.period}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.transactionCount} transaksi
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[oklch(0.65_0.18_30)]">
                            Rp {item.total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
