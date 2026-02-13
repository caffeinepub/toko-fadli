import Text "mo:core/Text";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  type Tier = {
    quantity : Int;
    totalPrice : Nat;
  };

  type Product = {
    id : Nat;
    name : Text;
    sku : ?Text;
    unit : Text;
    price : Nat;
    stock : Int;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    tiers : [Tier];
    photo : ?Storage.ExternalBlob;
  };

  module Product {
    public func compareByStock(a : Product, b : Product) : Order.Order {
      Int.compare(a.stock, b.stock);
    };
  };

  type CartItem = {
    productId : Nat;
    quantity : Int;
    unitPrice : Nat;
    lineTotal : Nat;
  };

  type Cart = {
    items : [CartItem];
    totalAmount : Nat;
  };

  type Transaction = {
    id : Nat;
    items : [CartItem];
    totalAmount : Nat;
    paymentMethod : Text;
    cashReceived : Nat;
    change : Nat;
    timestamp : Time.Time;
  };

  type StoreSettings = {
    storeName : Text;
    receiptFooter : ?Text;
  };

  let products = Map.empty<Nat, Product>();
  var nextProductId = 1;

  let transactions = Map.empty<Nat, Transaction>();
  var nextTransactionId = 1;

  let transactionIds = Set.empty<Nat>();
  var cartSet : Set.Set<Nat> = Set.empty<Nat>();
  var currentCart : ?Cart = null;

  var settings : StoreSettings = {
    storeName = "TOKO FADLI";
    receiptFooter = null;
  };

  public shared ({ caller }) func addOrUpdateProduct(id : ?Nat, name : Text, sku : ?Text, unit : Text, price : Nat, stock : Int, tiers : [Tier], photo : ?Storage.ExternalBlob) : async Nat {
    let currentTime = Time.now();

    let validatedTiers = validateAndSortTiers(tiers);
    let productId = switch (id) {
      case (?existingId) { existingId };
      case (null) {
        let newId = nextProductId;
        nextProductId += 1;
        newId;
      };
    };

    switch (id) {
      case (?existingId) {
        ignore(products.get(existingId));
      };
      case (null) {};
    };

    let product : Product = {
      id = productId;
      name;
      sku;
      unit;
      price;
      stock;
      createdAt = currentTime;
      updatedAt = currentTime;
      tiers = validatedTiers;
      photo;
    };

    products.add(productId, product);
    productId;
  };

  func validateAndSortTiers(tiers : [Tier]) : [Tier] {
    tiers.sort(
      func(a, b) {
        if (a.quantity == b.quantity) {
          return Nat.compare(a.totalPrice, b.totalPrice);
        };
        Int.compare(a.quantity, b.quantity);
      }
    );
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        products.remove(id);
        cartSet.remove(id);
      };
    };
  };

  public query ({ caller }) func getProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray().sort(Product.compareByStock);
  };

  func findMatchingTier(tiers : [Tier], quantity : Int) : ?Tier {
    let filtered = tiers.filter(func(t) { t.quantity == quantity });
    if (filtered.size() == 0) { null } else {
      ?filtered[0];
    };
  };

  public shared ({ caller }) func addToCart(productId : Nat, quantity : Int) : async () {
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        if (quantity <= 0 or quantity > product.stock) {
          Runtime.trap("Insufficient stock quantity available");
        };

        let lineTotal = switch (findMatchingTier(product.tiers, quantity)) {
          case (?tier) { tier.totalPrice };
          case (null) { product.price * Int.abs(quantity) };
        };

        let item : CartItem = {
          productId;
          quantity;
          unitPrice = product.price;
          lineTotal;
        };

        let newItems = switch (currentCart) {
          case (?cart) { cart.items.concat([item]) };
          case (null) { [item] };
        };

        let newTotal = newItems.foldLeft(0, func(acc, i) { acc + i.lineTotal });
        currentCart := ?{
          items = newItems;
          totalAmount = newTotal;
        };
        cartSet.add(productId);
      };
    };
  };

  public shared ({ caller }) func checkout(paymentMethod : Text, cashReceived : Nat) : async () {
    let cart = switch (currentCart) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?c) { c };
    };

    let (finalCashReceived, change) = switch (paymentMethod) {
      case ("Cash") {
        if (cashReceived < cart.totalAmount) {
          Runtime.trap("Insufficient cash amount");
        };
        (cashReceived, cashReceived - cart.totalAmount : Nat);
      };
      case (_) { (0, 0) };
    };

    let transaction : Transaction = {
      id = nextTransactionId;
      items = cart.items;
      totalAmount = cart.totalAmount;
      paymentMethod;
      cashReceived = finalCashReceived;
      change;
      timestamp = Time.now();
    };

    transactions.add(nextTransactionId, transaction);
    transactionIds.add(nextTransactionId);

    for (item in cart.items.values()) {
      switch (products.get(item.productId)) {
        case (null) {};
        case (?product) {
          let updatedProduct = {
            id = product.id;
            name = product.name;
            sku = product.sku;
            unit = product.unit;
            price = product.price;
            stock = product.stock - item.quantity;
            createdAt = product.createdAt;
            updatedAt = Time.now();
            tiers = product.tiers;
            photo = product.photo;
          };
          products.add(item.productId, updatedProduct);
        };
      };
    };

    cartSet.clear();
    currentCart := null;
    nextTransactionId += 1;
  };

  public query ({ caller }) func getCurrentCart() : async ?Cart {
    currentCart;
  };

  public query ({ caller }) func getStoreSettings() : async StoreSettings {
    settings;
  };

  public shared ({ caller }) func updateStoreSettings(storeName : Text, receiptFooter : ?Text) : async () {
    settings := { storeName; receiptFooter };
  };

  public query ({ caller }) func getAllSalesReports() : async [Transaction] {
    transactions.values().toArray();
  };
};
