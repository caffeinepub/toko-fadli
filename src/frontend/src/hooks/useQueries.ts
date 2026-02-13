import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Product, Transaction, Cart, StoreSettings, Tier } from '@/backend';
import { ExternalBlob } from '@/backend';

// Query Keys
export const queryKeys = {
  products: ['products'],
  cart: ['cart'],
  transactions: ['transactions'],
  settings: ['settings'],
};

// Products
export function useProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: queryKeys.products,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint | null;
      name: string;
      sku: string | null;
      unit: string;
      price: bigint;
      stock: bigint;
      tiers: Tier[];
      photo: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addOrUpdateProduct(
        data.id,
        data.name,
        data.sku,
        data.unit,
        data.price,
        data.stock,
        data.tiers,
        data.photo
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

// Cart
export function useCart() {
  const { actor, isFetching } = useActor();

  return useQuery<Cart | null>({
    queryKey: queryKeys.cart,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCurrentCart();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productId: bigint; quantity: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addToCart(data.productId, data.quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useCheckout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { paymentMethod: string; cashReceived: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.checkout(data.paymentMethod, data.cashReceived);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
    },
  });
}

// Transactions
export function useTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: queryKeys.transactions,
    queryFn: async () => {
      if (!actor) return [];
      const transactions = await actor.getAllSalesReports();
      // Sort by timestamp descending (most recent first)
      return transactions.sort((a, b) => Number(b.timestamp - a.timestamp));
    },
    enabled: !!actor && !isFetching,
  });
}

// Settings
export function useSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<StoreSettings>({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getStoreSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { storeName: string; receiptFooter: string | null }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateStoreSettings(data.storeName, data.receiptFooter);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
