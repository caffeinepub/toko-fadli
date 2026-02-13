# Specification

## Summary
**Goal:** Add per-product tier/package pricing and apply Option B pricing rules so POS totals, checkout, and receipts match when quantities exactly match a defined tier.

**Planned changes:**
- Extend the backend Product model to store 0..N tiers per product (quantity + total price), while keeping existing products valid with base unit pricing.
- Update backend product create/update to accept, validate, and persist tier lists (unique positive quantities, non-negative prices) in a deterministic order.
- Implement Option B cart pricing in the backend: use tier total price only when the purchased quantity exactly matches a tier quantity; otherwise use base unit price × quantity, and ensure transactions/receipts store matching totals.
- Add a tier/package pricing editor to the product create/edit dialog with client-side validation and persistence.
- Update POS cart line item display and total calculations to match the same Option B tier pricing rule used by the backend.

**User-visible outcome:** Users can define tier/package prices per product, and when adding items to the cart the POS will charge the tier total only for exact tier quantity matches; otherwise it charges normal unit pricing, with checkout and receipts reflecting the same totals.
