import { useState, useEffect } from 'react';
import { Settings, Store, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings, useUpdateSettings } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

export default function AboutSettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [storeName, setStoreName] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName);
      setReceiptFooter(settings.receiptFooter || '');
    }
  }, [settings]);

  const handleSave = async () => {
    if (!storeName.trim()) {
      setSaveError('Nama toko wajib diisi');
      return;
    }

    setSaveError('');
    setSaveSuccess(false);

    try {
      await updateSettingsMutation.mutateAsync({
        storeName: storeName.trim(),
        receiptFooter: receiptFooter.trim() || null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(error.message || 'Gagal menyimpan pengaturan');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h2 className="text-2xl font-bold text-foreground">Pengaturan & Tentang</h2>
        <p className="text-sm text-muted-foreground">Konfigurasi pengaturan toko</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Store Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[oklch(0.65_0.18_30)]" />
                <CardTitle>Pengaturan Toko</CardTitle>
              </div>
              <CardDescription>Sesuaikan informasi toko untuk struk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Nama Toko <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Masukkan nama toko"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Footer Struk (Opsional)
                    </label>
                    <Textarea
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                      placeholder="Terima kasih sudah berbelanja!"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Teks ini akan muncul di bagian bawah struk cetak
                    </p>
                  </div>

                  {saveSuccess && (
                    <Alert className="bg-[oklch(0.70_0.15_40)]/10 border-[oklch(0.70_0.15_40)]">
                      <AlertDescription className="text-[oklch(0.65_0.18_30)]">
                        Pengaturan berhasil disimpan!
                      </AlertDescription>
                    </Alert>
                  )}

                  {saveError && (
                    <Alert variant="destructive">
                      <AlertDescription>{saveError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    className="w-full bg-gradient-to-r from-[oklch(0.70_0.15_40)] to-[oklch(0.65_0.18_30)] hover:from-[oklch(0.68_0.15_40)] hover:to-[oklch(0.63_0.18_30)]"
                    onClick={handleSave}
                    disabled={updateSettingsMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[oklch(0.65_0.18_30)]" />
                <CardTitle>Tentang TOKO FADLI POS</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Sistem Kasir TOKO FADLI adalah aplikasi kasir modern dan mudah digunakan yang dirancang untuk toko retail.
              </p>
              <p>
                <strong className="text-foreground">Fitur:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Manajemen produk dan inventori</li>
                <li>Sistem kasir dengan dukungan barcode scanner</li>
                <li>Riwayat transaksi lengkap</li>
                <li>Laporan penjualan harian, mingguan, dan bulanan</li>
                <li>Cetak struk untuk pelanggan</li>
                <li>Upload foto produk</li>
                <li>Perhitungan kembalian otomatis</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
