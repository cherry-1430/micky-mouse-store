import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

const API_URL = "http://localhost:5000";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("mickyMouseCart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to load cart:", error);
      return [];
    }
  });

  /* =====================================================
     FLASH SALE CHECK
  ===================================================== */

  const isFlashSaleActive = (product) => {
    if (!product?.isFlashSale) {
      return false;
    }

    if (
      !product.salePrice ||
      Number(product.salePrice) <= 0
    ) {
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

  /* =====================================================
     EFFECTIVE PRICE
  ===================================================== */

  const getEffectivePrice = (product) => {
    if (isFlashSaleActive(product)) {
      return Number(product.salePrice);
    }

    return Number(product.price);
  };

  /* =====================================================
     SAVE CART
  ===================================================== */

  const saveCart = (updatedCart) => {
    setCart(updatedCart);

    localStorage.setItem(
      "mickyMouseCart",
      JSON.stringify(updatedCart)
    );
  };

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const addToCart = (product, size, quantity) => {
    const effectivePrice =
      getEffectivePrice(product);

    const existingItem = cart.find(
      (item) =>
        item.id === product._id &&
        item.size === size
    );

    if (existingItem) {
      const updatedCart = cart.map((item) => {
        if (
          item.id === product._id &&
          item.size === size
        ) {
          return {
            ...item,

            price: effectivePrice,

            originalPrice:
              Number(product.price),

            salePrice:
              Number(product.salePrice || 0),

            saleStart:
              product.saleStart || null,

            saleEnd:
              product.saleEnd || null,

            isFlashSale:
              Boolean(product.isFlashSale),

            quantity:
              Number(item.quantity) +
              Number(quantity),
          };
        }

        return item;
      });

      saveCart(updatedCart);
      return;
    }

    const newItem = {
      id: product._id,

      name: product.name,

      price: effectivePrice,

      originalPrice:
        Number(product.price),

      salePrice:
        Number(product.salePrice || 0),

      saleStart:
        product.saleStart || null,

      saleEnd:
        product.saleEnd || null,

      isFlashSale:
        Boolean(product.isFlashSale),

      image: product.image,

      size,

      quantity: Number(quantity),
    };

    saveCart([
      ...cart,
      newItem,
    ]);
  };

  /* =====================================================
     REMOVE FROM CART
  ===================================================== */

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

  /* =====================================================
     UPDATE QUANTITY
  ===================================================== */

  const updateQuantity = (
    id,
    size,
    quantity
  ) => {
    if (quantity < 1) {
      return;
    }

    const updatedCart = cart.map((item) => {
      if (
        item.id === id &&
        item.size === size
      ) {
        return {
          ...item,
          quantity: Number(quantity),
        };
      }

      return item;
    });

    saveCart(updatedCart);
  };

  /* =====================================================
     CLEAR CART
  ===================================================== */

  const clearCart = () => {
    saveCart([]);
  };

  /* =====================================================
     SYNC CART WITH DATABASE
     
     THIS IS THE IMPORTANT PART.

     Example:

     Cart:
     Product = ₹999

     MongoDB:
     Product = ₹1299

     After synchronization:

     Cart = ₹1299
  ===================================================== */

  const syncCartWithDatabase = async () => {
    if (cart.length === 0) {
      return {
        success: true,
        changed: false,
      };
    }

    try {
      const response = await fetch(
        `${API_URL}/api/products`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch products: ${response.status}`
        );
      }

      const products = await response.json();

      let changed = false;

      const updatedCart = cart
        .map((item) => {
          const product = products.find(
            (p) =>
              String(p._id) ===
              String(item.id)
          );

          /*
           * Product deleted from database
           */
          if (!product) {
            changed = true;

            return null;
          }

          const latestPrice =
            getEffectivePrice(product);

          const latestOriginalPrice =
            Number(product.price);

          const latestSalePrice =
            Number(product.salePrice || 0);

          const latestIsFlashSale =
            Boolean(product.isFlashSale);

          const latestSaleStart =
            product.saleStart || null;

          const latestSaleEnd =
            product.saleEnd || null;

          /*
           * Detect any important product change
           */

          if (
            Number(item.price) !==
              latestPrice ||
            Number(item.originalPrice) !==
              latestOriginalPrice ||
            Number(item.salePrice || 0) !==
              latestSalePrice ||
            Boolean(item.isFlashSale) !==
              latestIsFlashSale ||
            item.saleStart !==
              latestSaleStart ||
            item.saleEnd !==
              latestSaleEnd
          ) {
            changed = true;
          }

          /*
           * Update cart with latest DB data
           */

          return {
            ...item,

            name: product.name,

            price: latestPrice,

            originalPrice:
              latestOriginalPrice,

            salePrice:
              latestSalePrice,

            saleStart:
              latestSaleStart,

            saleEnd:
              latestSaleEnd,

            isFlashSale:
              latestIsFlashSale,

            image: product.image,

            /*
             * Keep current cart quantity.
             * Stock is validated separately
             * by checkout/backend.
             */
            quantity:
              Number(item.quantity),
          };
        })
        .filter(Boolean);

      if (changed) {
        setCart(updatedCart);

        localStorage.setItem(
          "mickyMouseCart",
          JSON.stringify(updatedCart)
        );
      }

      return {
        success: true,
        changed,
        cart: updatedCart,
      };
    } catch (error) {
      console.error(
        "Cart synchronization error:",
        error
      );

      return {
        success: false,
        changed: false,
        error: error.message,
      };
    }
  };

  /* =====================================================
     INITIAL CART PRICE SYNC
     
     Runs when CartProvider loads.
  ===================================================== */

  useEffect(() => {
    syncCartWithDatabase();
  }, []);

  /* =====================================================
     FLASH SALE TIMER SYNC
     
     Checks every 30 seconds.
  ===================================================== */

  useEffect(() => {
    const updateFlashSalePrices = () => {
      setCart((currentCart) => {
        let changed = false;

        const updatedCart =
          currentCart.map((item) => {
            if (!item.isFlashSale) {
              return item;
            }

            const now = new Date();

            const saleStart =
              item.saleStart
                ? new Date(item.saleStart)
                : null;

            const saleEnd =
              item.saleEnd
                ? new Date(item.saleEnd)
                : null;

            const saleActive =
              Number(item.salePrice) > 0 &&
              (!saleStart ||
                now >= saleStart) &&
              (!saleEnd ||
                now <= saleEnd);

            const correctPrice =
              saleActive
                ? Number(item.salePrice)
                : Number(item.originalPrice);

            if (
              Number(item.price) !==
              correctPrice
            ) {
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

    updateFlashSalePrices();

    const interval = setInterval(
      updateFlashSalePrices,
      30000
    );

    return () =>
      clearInterval(interval);
  }, []);

  /* =====================================================
     CART COUNT
  ===================================================== */

  const cartCount = cart.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0
  );

  /* =====================================================
     CART TOTAL
  ===================================================== */

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  /* =====================================================
     PROVIDER
  ===================================================== */

  return (
    <CartContext.Provider
      value={{
        cart,

        addToCart,

        removeFromCart,

        updateQuantity,

        cartCount,

        cartTotal,

        clearCart,

        getEffectivePrice,

        isFlashSaleActive,

        syncCartWithDatabase,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}