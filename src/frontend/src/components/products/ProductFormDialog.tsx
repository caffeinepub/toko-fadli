import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useCreateOrUpdateProduct } from '@/hooks/useQueries';
import type { Product, Tier } from '@/backend';
import { ExternalBlob } from '@/backend';
import { validateTiers, normalizeTiers, type TierValidationError } from '@/lib/pricing';

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

interface TierInput {
  quantity: string;
  totalPrice: string;
}

export function ProductFormDialog({ open, onClose, product }: ProductFormDialogProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [keepExistingPhoto, setKeepExistingPhoto] = useState(true);
  const [tiers, setTiers] = useState<TierInput[]>([]);
  const [error, setError] = useState('');
  const [tierErrors, setTierErrors] = useState<TierValidationError[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useCreateOrUpdateProduct();

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku || '');
      setUnit(product.unit);
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setPhotoPreview(product.photo ? product.photo.getDirectURL() : null);
      setKeepExistingPhoto(true);
      setPhotoFile(null);
      
      // Load existing tiers
      if (product.tiers && product.tiers.length > 0) {
        setTiers(
          product.tiers.map((tier) => ({
            quantity: tier.quantity.toString(),
            totalPrice: tier.totalPrice.toString(),
          }))
        );
      } else {
        setTiers([]);
      }
    } else {
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
    setName('');
    setSku('');
    setUnit('');
    setPrice('');
    setStock('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setKeepExistingPhoto(true);
    setTiers([]);
    setError('');
    setTierErrors([]);
    setUploadProgress(0);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    setPhotoFile(file);
    setKeepExistingPhoto(false);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setKeepExistingPhoto(false);
  };

  const addTier = () => {
    setTiers([...tiers, { quantity: '', totalPrice: '' }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
    setTierErrors(tierErrors.filter((err) => err.index !== index));
  };

  const updateTier = (index: number, field: 'quantity' | 'totalPrice', value: string) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
    
    // Clear errors for this field
    setTierErrors(tierErrors.filter((err) => !(err.index === index && err.field === field)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTierErrors([]);

    if (!name.trim()) {
      setError('Nama produk wajib diisi');
      return;
    }

    if (!unit.trim()) {
      setError('Satuan wajib diisi');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Harga harus berupa angka positif');
      return;
    }

    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stok harus berupa angka positif');
      return;
    }

    // Validate and parse tiers
    const parsedTiers: Array<{ quantity: number; totalPrice: number }> = [];
    
    for (const tier of tiers) {
      if (tier.quantity.trim() === '' && tier.totalPrice.trim() === '') {
        // Skip empty tiers
        continue;
      }
      
      const qty = parseInt(tier.quantity);
      const price = parseFloat(tier.totalPrice);
      
      if (isNaN(qty) || isNaN(price)) {
        setError('Semua paket harga harus diisi dengan angka yang valid');
        return;
      }
      
      parsedTiers.push({ quantity: qty, totalPrice: Math.floor(price) });
    }

    // Validate tiers
    if (parsedTiers.length > 0) {
      const validationErrors = validateTiers(parsedTiers);
      if (validationErrors.length > 0) {
        setTierErrors(validationErrors);
        setError('Ada kesalahan pada paket harga. Periksa kembali.');
        return;
      }
    }

    // Normalize tiers (sort by quantity)
    const normalizedTiers = normalizeTiers(parsedTiers);

    try {
      let photoBlob: ExternalBlob | null = null;

      // Handle photo upload
      if (photoFile) {
        const arrayBuffer = await photoFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        photoBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      } else if (product?.photo && keepExistingPhoto) {
        photoBlob = product.photo;
      }

      // Convert to backend Tier format
      const backendTiers: Tier[] = normalizedTiers.map((tier) => ({
        quantity: BigInt(tier.quantity),
        totalPrice: BigInt(tier.totalPrice),
      }));

      await mutation.mutateAsync({
        id: product?.id || null,
        name: name.trim(),
        sku: sku.trim() || null,
        unit: unit.trim(),
        price: BigInt(Math.floor(priceNum)),
        stock: BigInt(stockNum),
        tiers: backendTiers,
        photo: photoBlob,
      });

      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produk');
    }
  };

  const getTierError = (index: number, field: 'quantity' | 'totalPrice'): string | undefined => {
    const error = tierErrors.find((err) => err.index === index && err.field === field);
    return error?.message;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Foto Produk (Opsional)</Label>
            {photoPreview ? (
              <div className="relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted max-w-xs">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemovePhoto}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center max-w-xs">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    Klik untuk upload foto
                  </span>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </Label>
              </div>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="text-xs text-muted-foreground">
                Upload: {uploadProgress}%
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Produk <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Indomie Goreng"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Barcode</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Contoh: 8992388101015"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">
                Satuan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, kg, box"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Harga Satuan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">
                Stok <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Tier Pricing Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Paket Harga (Opsional)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Tambahkan harga khusus untuk jumlah tertentu. Contoh: 5 pcs = Rp 8.000
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTier}
                disabled={mutation.isPending}
              >
                <Plus className="w-4 h-4 mr-1" />
                Tambah Paket
              </Button>
            </div>

            {tiers.length > 0 && (
              <div className="space-y-2">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Input
                          type="number"
                          placeholder="Jumlah"
                          value={tier.quantity}
                          onChange={(e) => updateTier(index, 'quantity', e.target.value)}
                          min="1"
                          className={getTierError(index, 'quantity') ? 'border-destructive' : ''}
                        />
                        {getTierError(index, 'quantity') && (
                          <p className="text-xs text-destructive">{getTierError(index, 'quantity')}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          placeholder="Total Harga"
                          value={tier.totalPrice}
                          onChange={(e) => updateTier(index, 'totalPrice', e.target.value)}
                          min="0"
                          className={getTierError(index, 'totalPrice') ? 'border-destructive' : ''}
                        />
                        {getTierError(index, 'totalPrice') && (
                          <p className="text-xs text-destructive">{getTierError(index, 'totalPrice')}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTier(index)}
                      disabled={mutation.isPending}
                      className="mt-0"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={mutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[oklch(0.70_0.15_40)] to-[oklch(0.65_0.18_30)] hover:from-[oklch(0.68_0.15_40)] hover:to-[oklch(0.63_0.18_30)]"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
