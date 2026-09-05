import { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {

  const [cart, setCart] = useState(() => {

    const savedCart =
      localStorage.getItem("mickyMouseCart");

    return savedCart
      ? JSON.parse(savedCart)
      : [];

  });


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

  if (existingItem) {

    const updatedCart = cart.map((item) => {

      if (
        item.id === product._id &&
        item.size === size
      ) {

        return {
          ...item,
          quantity:
            item.quantity + quantity,
        };

      }

      return item;

    });

    saveCart(updatedCart);

  } else {

    const newItem = {

      id: product._id,

      name: product.name,

      price: product.price,

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

  const removeFromCart = (
    id,
    size
  ) => {

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


  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );


  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
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