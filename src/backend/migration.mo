import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Set "mo:core/Set";
import Storage "blob-storage/Storage";

module {
  type OldProduct = {
    id : Nat;
    name : Text;
    sku : ?Text;
    unit : Text;
    price : Nat;
    stock : Int;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    photo : ?Storage.ExternalBlob;
  };

  type Tier = {
    quantity : Int;
    totalPrice : Nat;
  };

  type NewProduct = {
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

  type OldActor = {
    products : Map.Map<Nat, OldProduct>;
    transactions : Map.Map<Nat, Transaction>;
    transactionIds : Set.Set<Nat>;
    cartSet : Set.Set<Nat>;
    currentCart : ?Cart;
    settings : StoreSettings;
    nextProductId : Nat;
    nextTransactionId : Nat;
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

  type NewActor = {
    products : Map.Map<Nat, NewProduct>;
    transactions : Map.Map<Nat, Transaction>;
    transactionIds : Set.Set<Nat>;
    cartSet : Set.Set<Nat>;
    currentCart : ?Cart;
    settings : StoreSettings;
    nextProductId : Nat;
    nextTransactionId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, OldProduct, NewProduct>(
      func(_id, oldProduct) {
        {
          oldProduct with
          tiers = [];
        };
      }
    );
    {
      old with
      products = newProducts;
    };
  };
};
