import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Transaction, StoreSettings, Product } from '@/backend';
import { format } from 'date-fns';

interface ReceiptLayoutProps {
  transaction: Transaction;
  settings: StoreSettings;
  products: Product[];
}

export function ReceiptLayout({ transaction, settings, products }: ReceiptLayoutProps) {
  const handlePrint = () => {
    window.print();
  };

  const date = new Date(Number(transaction.timestamp) / 1_000_000);

  // Get product names for items
  const getProductName = (productId: bigint) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || `Produk #${productId}`;
  };

  const isCashPayment = transaction.paymentMethod === 'Tunai';

  return (
    <div className="max-w-md mx-auto">
      {/* Print Button - Hidden on print */}
      <div className="mb-4 print:hidden">
        <Button
          onClick={handlePrint}
          className="w-full bg-gradient-to-r from-[oklch(0.70_0.15_40)] to-[oklch(0.65_0.18_30)] hover:from-[oklch(0.68_0.15_40)] hover:to-[oklch(0.63_0.18_30)]"
        >
          <Printer className="w-4 h-4 mr-2" />
          Cetak Struk
        </Button>
      </div>

      {/* Receipt */}
      <Card className="receipt-content">
        <CardContent className="p-6 font-mono text-sm">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold mb-1">{settings.storeName}</h1>
            <p className="text-xs text-muted-foreground">Struk Pembayaran</p>
          </div>

          <Separator className="my-4" />

          {/* Transaction Info */}
          <div className="space-y-1 text-xs mb-4">
            <div className="flex justify-between">
              <span>ID Transaksi:</span>
              <span className="font-semibold">#{transaction.id.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{format(date, 'dd MMM yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{format(date, 'HH:mm:ss')}</span>
            </div>
            <div className="flex justify-between">
              <span>Pembayaran:</span>
              <span>{transaction.paymentMethod}</span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Items */}
          <div className="space-y-3 mb-4">
            {transaction.items.map((item, index) => (
              <div key={index}>
                <div className="font-semibold">{getProductName(item.productId)}</div>
                <div className="flex justify-between text-xs">
                  <span>
                    {Number(item.quantity)} x Rp {Number(item.unitPrice).toLocaleString()}
                  </span>
                  <span className="font-semibold">Rp {Number(item.lineTotal).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Total */}
          <div className="flex justify-between text-base font-bold mb-2">
            <span>TOTAL</span>
            <span>Rp {Number(transaction.totalAmount).toLocaleString()}</span>
          </div>

          {/* Cash Payment Details */}
          {isCashPayment && Number(transaction.cashReceived) > 0 && (
            <div className="space-y-1 text-xs mb-4">
              <div className="flex justify-between">
                <span>Uang Dibayar:</span>
                <span>Rp {Number(transaction.cashReceived).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Kembalian:</span>
                <span>Rp {Number(transaction.change).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Footer */}
          {settings.receiptFooter && (
            <>
              <Separator className="my-4" />
              <div className="text-center text-xs text-muted-foreground">
                {settings.receiptFooter}
              </div>
            </>
          )}

          <div className="text-center text-xs text-muted-foreground mt-4">
            Terima kasih atas pembelian Anda!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
