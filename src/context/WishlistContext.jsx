import { createContext, useState } from "react";

export const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem(
      "mickyMouseWishlist"
    );

    return savedWishlist
      ? JSON.parse(savedWishlist)
      : [];
  });

  // Get the ID regardless of whether the product
  // comes from MongoDB (_id) or older local data (id)
  const getProductId = (product) => {
    return product._id || product.id;
  };

  const toggleWishlist = (product) => {
    const productId = getProductId(product);

    const exists = wishlist.some(
      (item) => getProductId(item) === productId
    );

    let updatedWishlist;

    if (exists) {
      updatedWishlist = wishlist.filter(
        (item) => getProductId(item) !== productId
      );
    } else {
      updatedWishlist = [
        ...wishlist,
        product,
      ];
    }

    setWishlist(updatedWishlist);

    localStorage.setItem(
      "mickyMouseWishlist",
      JSON.stringify(updatedWishlist)
    );
  };

  const isInWishlist = (id) => {
    return wishlist.some(
      (item) => getProductId(item) === id
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}