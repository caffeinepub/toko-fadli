import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Plus, Minus, Trash2, ShoppingCart, Barcode, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useProducts, useCart, useAddToCart, useCheckout } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateLineTotal, formatRupiah } from '@/lib/pricing';
import type { Product } from '@/backend';

interface CartItemLocal {
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [localCart, setLocalCart] = useState<CartItemLocal[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Tunai');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string>('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: backendCart } = useCart();
  const addToCartMutation = useAddToCart();
  const checkoutMutation = useCheckout();

  // Auto-focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const addToLocalCart = (product: Product) => {
    if (Number(product.stock) <= 0) {
      setCheckoutError('Produk habis');
      return;
    }

    setLocalCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > Number(product.stock)) {
          setCheckoutError('Stok tidak cukup');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCheckoutError('');
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      const sku = barcodeInput.trim();
      
      if (!products) {
        setCheckoutError('Produk belum dimuat');
        setBarcodeInput('');
        // Refocus after state update
        requestAnimationFrame(() => {
          barcodeInputRef.current?.focus();
        });
        return;
      }

      const product = products.find(
        (p) => p.sku && p.sku.toLowerCase() === sku.toLowerCase()
      );

      if (!product) {
        setCheckoutError(`SKU "${sku}" tidak ditemukan`);
        setBarcodeInput('');
        // Refocus after state update
        requestAnimationFrame(() => {
          barcodeInputRef.current?.focus();
        });
        return;
      }

      if (Number(product.stock) <= 0) {
        setCheckoutError(`Produk "${product.name}" habis`);
        setBarcodeInput('');
        // Refocus after state update
        requestAnimationFrame(() => {
          barcodeInputRef.current?.focus();
        });
        return;
      }

      const existingItem = localCart.find((item) => item.product.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      
      if (currentQty + 1 > Number(product.stock)) {
        setCheckoutError(`Stok "${product.name}" tidak cukup`);
        setBarcodeInput('');
        // Refocus after state update
        requestAnimationFrame(() => {
          barcodeInputRef.current?.focus();
        });
        return;
      }

      addToLocalCart(product);
      setBarcodeInput('');
      setCheckoutError('');
      // Refocus after successful scan
      requestAnimationFrame(() => {
        barcodeInputRef.current?.focus();
      });
    }
  };

  const updateQuantity = (productId: bigint, delta: number) => {
    setLocalCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > Number(item.product.stock)) {
              setCheckoutError('Stok tidak cukup');
              return item;
            }
            setCheckoutError('');
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item): item is CartItemLocal => item !== null);
    });
  };

  const removeFromCart = (productId: bigint) => {
    setLocalCart((prev) => prev.filter((item) => item.product.id !== productId));
    setCheckoutError('');
  };

  const cartTotal = useMemo(() => {
    return localCart.reduce((sum, item) => {
      const lineTotal = calculateLineTotal(item.product, item.quantity);
      return sum + lineTotal;
    }, 0);
  }, [localCart]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'Tunai') return 0;
    const received = parseFloat(cashReceived) || 0;
    return Math.max(0, received - cartTotal);
  }, [paymentMethod, cashReceived, cartTotal]);

  const handleCheckout = async () => {
    if (localCart.length === 0) {
      setCheckoutError('Keranjang kosong');
      return;
    }

    if (!paymentMethod) {
      setCheckoutError('Pilih metode pembayaran');
      return;
    }

    if (paymentMethod === 'Tunai') {
      const received = parseFloat(cashReceived) || 0;
      if (received < cartTotal) {
        setCheckoutError('Uang yang dibayar kurang dari total');
        return;
      }
    }

    setCheckoutError('');

    try {
      // Add all items to backend cart
      for (const item of localCart) {
        await addToCartMutation.mutateAsync({
          productId: item.product.id,
          quantity: BigInt(item.quantity),
        });
      }

      // Checkout with cash received
      const cashAmount = paymentMethod === 'Tunai' ? BigInt(Math.floor(parseFloat(cashReceived) || 0)) : BigInt(0);
      await checkoutMutation.mutateAsync({ paymentMethod, cashReceived: cashAmount });

      // Reset state
      setLocalCart([]);
      setPaymentMethod('Tunai');
      setCashReceived('');
      
      // Navigate to transactions page with a flag to show the latest receipt
      navigate({ to: '/transactions', search: { showLatest: 'true' } });
    } catch (error: any) {
      setCheckoutError(error.message || 'Checkout gagal. Silakan coba lagi.');
    }
  };

  const getLineTotalDisplay = (item: CartItemLocal): string => {
    const lineTotal = calculateLineTotal(item.product, item.quantity);
    return formatRupiah(lineTotal);
  };

  const hasTierPricing = (product: Product): boolean => {
    return product.tiers && product.tiers.length > 0;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h2 className="text-2xl font-bold text-foreground">Kasir</h2>
        <p className="text-sm text-muted-foreground">Pilih produk dan selesaikan pembayaran</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle>Produk</CardTitle>
              <div className="space-y-3 mt-4">
                {/* Barcode Scanner Input */}
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan barcode atau ketik SKU..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    className="pl-10"
                  />
                </div>
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {productsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {searchTerm ? 'Produk tidak ditemukan' : 'Belum ada produk'}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id.toString()}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => addToLocalCart(product)}
                    >
                      <CardContent className="p-4">
                        {product.photo ? (
                          <div className="aspect-square rounded-md overflow-hidden bg-muted mb-3">
                            <img
                              src={product.photo.getDirectURL()}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center">
                            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-primary">
                              {formatRupiah(Number(product.price))}
                            </p>
                            {hasTierPricing(product) && (
                              <Badge variant="secondary" className="text-xs">
                                <Package className="w-3 h-3 mr-1" />
                                Paket
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Stok: {product.stock.toString()} {product.unit}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="w-96 border-l border-border bg-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6" />
            <h3 className="text-xl font-bold">Keranjang</h3>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto space-y-3 mb-4">
            {localCart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Keranjang kosong
              </div>
            ) : (
              localCart.map((item) => (
                <Card key={item.product.id.toString()}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatRupiah(Number(item.product.price))} / {item.product.unit}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{getLineTotalDisplay(item)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Payment Section */}
          <div className="space-y-4 border-t border-border pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Metode Pembayaran</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tunai">Tunai</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'Tunai' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Uang Diterima</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  min="0"
                />
              </div>
            )}

            <div className="space-y-2 bg-muted p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-bold">{formatRupiah(cartTotal)}</span>
              </div>
              {paymentMethod === 'Tunai' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Diterima</span>
                    <span>{formatRupiah(parseFloat(cashReceived) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-primary">
                    <span>Kembalian</span>
                    <span>{formatRupiah(changeAmount)}</span>
                  </div>
                </>
              )}
            </div>

            {checkoutError && (
              <Alert variant="destructive">
                <AlertDescription>{checkoutError}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full bg-gradient-to-r from-[oklch(0.70_0.15_40)] to-[oklch(0.65_0.18_30)] hover:from-[oklch(0.68_0.15_40)] hover:to-[oklch(0.63_0.18_30)]"
              size="lg"
              onClick={handleCheckout}
              disabled={localCart.length === 0 || checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? 'Memproses...' : 'Checkout'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
