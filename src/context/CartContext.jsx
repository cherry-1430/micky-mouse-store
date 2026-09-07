import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("mickyMouseCart");

    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Check whether a product's flash sale is currently active
  const isFlashSaleActive = (product) => {
    if (!product?.isFlashSale) {
      return false;
    }

    if (!product.salePrice || Number(product.salePrice) <= 0) {
      return false;
    }

    const now = new Date();

    const saleStart = product.saleStart
      ? new Date(product.saleStart)
      : null;

    const saleEnd = product.saleEnd
      ? new Date(product.saleEnd)
      : null;

    if (saleStart && now < saleStart) {
      return false;
    }

    if (saleEnd && now > saleEnd) {
      return false;
    }

    return true;
  };

  // Get the actual price that should be charged
  const getEffectivePrice = (product) => {
    if (isFlashSaleActive(product)) {
      return Number(product.salePrice);
    }

    return Number(product.price);
  };

  const saveCart = (updatedCart) => {
    setCart(updatedCart);

    localStorage.setItem(
      "mickyMouseCart",
      JSON.stringify(updatedCart)
    );
  };

  const addToCart = (product, size, quantity) => {
    const existingItem = cart.find(
      (item) =>
        item.id === product._id &&
        item.size === size
    );

    const effectivePrice = getEffectivePrice(product);

    if (existingItem) {
      const updatedCart = cart.map((item) => {
        if (
          item.id === product._id &&
          item.size === size
        ) {
          return {
            ...item,

            // IMPORTANT:
            // Update price in case the product is currently
            // on flash sale.
            price: effectivePrice,

            originalPrice: Number(product.price),

            salePrice: Number(product.salePrice || 0),

            saleStart: product.saleStart || null,

            saleEnd: product.saleEnd || null,

            isFlashSale: product.isFlashSale || false,

            quantity: item.quantity + quantity,
          };
        }

        return item;
      });

      saveCart(updatedCart);
    } else {
      const newItem = {
        id: product._id,

        name: product.name,

        // This is now the ACTUAL selling price
        price: effectivePrice,

        // Keep the normal price for displaying discounts
        originalPrice: Number(product.price),

        // Store flash-sale information
        salePrice: Number(product.salePrice || 0),

        saleStart: product.saleStart || null,

        saleEnd: product.saleEnd || null,

        isFlashSale: product.isFlashSale || false,

        image: product.image,

        size: size,

        quantity: quantity,
      };

      saveCart([
        ...cart,
        newItem,
      ]);
    }
  };

  const removeFromCart = (id, size) => {
    const updatedCart = cart.filter(
      (item) =>
        !(
          item.id === id &&
          item.size === size
        )
    );

    saveCart(updatedCart);
  };

  const updateQuantity = (
    id,
    size,
    quantity
  ) => {
    if (quantity < 1) return;

    const updatedCart = cart.map(
      (item) => {
        if (
          item.id === id &&
          item.size === size
        ) {
          return {
            ...item,
            quantity: quantity,
          };
        }

        return item;
      }
    );

    saveCart(updatedCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  /*
    Keep cart prices synchronized with Flash Sale timing.

    Example:
    ₹999 normal
    ₹599 flash sale

    When sale starts:
    cart price → ₹599

    When sale ends:
    cart price → ₹999
  */
  useEffect(() => {
    const updateExpiredSalePrices = () => {
      setCart((currentCart) => {
        let changed = false;

        const updatedCart = currentCart.map((item) => {
          if (!item.isFlashSale) {
            return item;
          }

          const now = new Date();

          const saleStart = item.saleStart
            ? new Date(item.saleStart)
            : null;

          const saleEnd = item.saleEnd
            ? new Date(item.saleEnd)
            : null;

          const saleActive =
            item.salePrice &&
            (!saleStart || now >= saleStart) &&
            (!saleEnd || now <= saleEnd);

          const correctPrice = saleActive
            ? Number(item.salePrice)
            : Number(item.originalPrice);

          if (Number(item.price) !== correctPrice) {
            changed = true;

            return {
              ...item,
              price: correctPrice,
            };
          }

          return item;
        });

        if (changed) {
          localStorage.setItem(
            "mickyMouseCart",
            JSON.stringify(updatedCart)
          );
        }

        return updatedCart;
      });
    };

    // Check immediately
    updateExpiredSalePrices();

    // Check every 30 seconds
    const interval = setInterval(
      updateExpiredSalePrices,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  const cartCount = cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        clearCart,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}