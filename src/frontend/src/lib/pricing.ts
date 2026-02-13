import type { Product, Tier } from '@/backend';

/**
 * Validation utilities for tier/package pricing
 */

export interface TierValidationError {
  index: number;
  field: 'quantity' | 'totalPrice';
  message: string;
}

/**
 * Validates a list of tiers for duplicate quantities, non-positive quantities, and negative prices
 */
export function validateTiers(tiers: Array<{ quantity: number; totalPrice: number }>): TierValidationError[] {
  const errors: TierValidationError[] = [];
  const quantities = new Set<number>();

  tiers.forEach((tier, index) => {
    // Check for non-positive quantity
    if (tier.quantity <= 0) {
      errors.push({
        index,
        field: 'quantity',
        message: 'Jumlah harus lebih dari 0',
      });
    }

    // Check for duplicate quantity
    if (quantities.has(tier.quantity)) {
      errors.push({
        index,
        field: 'quantity',
        message: 'Jumlah sudah ada',
      });
    }
    quantities.add(tier.quantity);

    // Check for negative price
    if (tier.totalPrice < 0) {
      errors.push({
        index,
        field: 'totalPrice',
        message: 'Harga tidak boleh negatif',
      });
    }
  });

  return errors;
}

/**
 * Normalizes and sorts tiers by quantity ascending for consistent storage and display
 */
export function normalizeTiers(tiers: Array<{ quantity: number; totalPrice: number }>): Array<{ quantity: number; totalPrice: number }> {
  return [...tiers].sort((a, b) => a.quantity - b.quantity);
}

/**
 * Calculates line total using Option B tier/package pricing:
 * - If quantity exactly matches a tier quantity, use tier.totalPrice
 * - Otherwise, use product.price * quantity
 */
export function calculateLineTotal(product: Product, quantity: number): number {
  // Find exact tier match
  const matchingTier = product.tiers.find((tier) => Number(tier.quantity) === quantity);
  
  if (matchingTier) {
    return Number(matchingTier.totalPrice);
  }
  
  // No tier match, use base price
  return Number(product.price) * quantity;
}

/**
 * Formats a number as Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
