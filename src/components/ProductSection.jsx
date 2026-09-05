import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProducts } from "../api/productApi";
import { useWishlist } from "../context/useWishlist";
import { useCart } from "../context/useCart";

  function ProductSection() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();

const featuredProducts = data
  .filter((product) => product.isFeatured)
  .slice(0, 4);

setProducts(featuredProducts);
      } catch (error) {
        console.error("Failed to load featured products:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <section className="product-section">

      <div className="section-heading">
        <p>OUR BEST PICKS</p>

        <h2>FEATURED PRODUCTS</h2>

        <span>
          Discover some of our most-loved styles.
        </span>
      </div>

      <div className="product-grid">

        {products.map((product, index) => (
          <div className="product-card" key={product._id}>

            {/* Image */}
            <div className="product-image">

              <img
                src={product.image}
                alt={product.name}
              />

              <div className="product-number">
                0{index + 1}
              </div>

              <button
  className="wishlist-button"
  aria-label={
    isInWishlist(product._id)
      ? "Remove from wishlist"
      : "Add to wishlist"
  }
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist(product);
  }}
>
  {isInWishlist(product._id) ? "♥" : "♡"}
</button>
              <div className="product-overlay">
                <Link
                   to={`/product/${product._id}`}
                >
                  VIEW COLLECTION →
                </Link>
              </div>

            </div>

            {/* Information */}
            <div className="product-info">

              <p className="product-category">
                {product.category}
              </p>

              <h3>{product.name}</h3>

              <div className="product-bottom">

                <p className="product-price">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>

                <button
  className="add-cart-button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    const size = product.sizes?.[0];

    if (!size) {
      alert("No size available");
      return;
    }

    addToCart(product, size, 1);

    alert(`${product.name} added to cart`);
  }}
>
  ADD TO CART
</button>

              </div>

            </div>

          </div>
        ))}

      </div>

      <div className="product-section-footer">

        <Link to="/shop" className="view-all-products">
          VIEW ALL PRODUCTS →
        </Link>

      </div>

    </section>
  );
}

export default ProductSection;
