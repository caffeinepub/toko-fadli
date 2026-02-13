import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Product {
    id: bigint;
    sku?: string;
    tiers: Array<Tier>;
    name: string;
    createdAt: Time;
    unit: string;
    updatedAt: Time;
    stock: bigint;
    photo?: ExternalBlob;
    price: bigint;
}
export type Time = bigint;
export interface StoreSettings {
    receiptFooter?: string;
    storeName: string;
}
export interface Cart {
    totalAmount: bigint;
    items: Array<CartItem>;
}
export interface CartItem {
    lineTotal: bigint;
    productId: bigint;
    quantity: bigint;
    unitPrice: bigint;
}
export interface Tier {
    quantity: bigint;
    totalPrice: bigint;
}
export interface Transaction {
    id: bigint;
    cashReceived: bigint;
    paymentMethod: string;
    totalAmount: bigint;
    timestamp: Time;
    change: bigint;
    items: Array<CartItem>;
}
export interface backendInterface {
    addOrUpdateProduct(id: bigint | null, name: string, sku: string | null, unit: string, price: bigint, stock: bigint, tiers: Array<Tier>, photo: ExternalBlob | null): Promise<bigint>;
    addToCart(productId: bigint, quantity: bigint): Promise<void>;
    checkout(paymentMethod: string, cashReceived: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    getAllProducts(): Promise<Array<Product>>;
    getAllSalesReports(): Promise<Array<Transaction>>;
    getCurrentCart(): Promise<Cart | null>;
    getProduct(id: bigint): Promise<Product>;
    getStoreSettings(): Promise<StoreSettings>;
    updateStoreSettings(storeName: string, receiptFooter: string | null): Promise<void>;
}
