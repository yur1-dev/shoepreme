"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  createCart,
  addCartLines,
  removeCartLines,
  updateCartLines,
  getCart,
} from "@/lib/shopify";

interface CartLine {
  id: string;
  quantity: number;
  cost: { totalAmount: { amount: string; currencyCode: string } };
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: {
      title: string;
      handle: string;
      images: { edges: { node: { url: string; altText: string | null } }[] };
    };
    selectedOptions: { name: string; value: string }[];
  };
}

interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: { amount: string; currencyCode: string };
    subtotalAmount: { amount: string; currencyCode: string };
  };
  lines: { edges: { node: CartLine }[] };
}

interface CartContextType {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (merchandiseId: string, quantity?: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  checkout: () => void;
  totalQuantity: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Restore cart from localStorage on mount
  useEffect(() => {
    const savedCartId = localStorage.getItem("sp_cart_id");
    if (savedCartId) {
      getCart(savedCartId)
        .then((c) => {
          if (c) setCart(c);
        })
        .catch(() => localStorage.removeItem("sp_cart_id"));
    }
  }, []);

  const addToCart = useCallback(
    async (merchandiseId: string, quantity = 1) => {
      setIsLoading(true);
      try {
        let updatedCart: Cart;

        if (cart?.id) {
          // Check if this variant already exists in cart
          const existingLine = cart.lines.edges
            .map((e) => e.node)
            .find((line) => line.merchandise.id === merchandiseId);

          if (existingLine) {
            updatedCart = await updateCartLines(cart.id, [
              {
                id: existingLine.id,
                quantity: existingLine.quantity + quantity,
              },
            ]);
          } else {
            updatedCart = await addCartLines(cart.id, [
              { merchandiseId, quantity },
            ]);
          }
        } else {
          updatedCart = await createCart([{ merchandiseId, quantity }]);
          localStorage.setItem("sp_cart_id", updatedCart.id);
        }

        setCart(updatedCart);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    },
    [cart],
  );

  const removeFromCart = useCallback(
    async (lineId: string) => {
      if (!cart?.id) return;
      setIsLoading(true);
      try {
        const updatedCart = await removeCartLines(cart.id, [lineId]);
        setCart(updatedCart);
      } finally {
        setIsLoading(false);
      }
    },
    [cart],
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart?.id) return;
      if (quantity < 1) return;
      setIsLoading(true);
      try {
        const updatedCart = await updateCartLines(cart.id, [
          { id: lineId, quantity },
        ]);
        setCart(updatedCart);
      } finally {
        setIsLoading(false);
      }
    },
    [cart],
  );

  const checkout = useCallback(() => {
    if (cart?.checkoutUrl) {
      window.location.href = cart.checkoutUrl;
    }
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isLoading,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addToCart,
        removeFromCart,
        updateQuantity,
        checkout,

        totalQuantity: cart?.totalQuantity ?? 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
