import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWishlist } from "../context/useWishlist";
import { useCart } from "../context/useCart";
import { getProduct } from "../api/productApi";

function ProductDetails() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProduct(id);
        setProduct(data);

        if (data.sizes?.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      } catch (error) {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <main className="product-not-found">
        <span>PLEASE WAIT</span>
        <h1>Loading Product...</h1>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-not-found">
        <span>404 • PRODUCT</span>
        <h1>Product Not Found</h1>

        <p>
          {error || "Sorry, this product does not exist."}
        </p>

        <Link to="/shop" className="back-to-shop">
          ← BACK TO SHOP
        </Link>
      </main>
    );
  }

  const increaseQuantity = () => {
    setQuantity((previous) => previous + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((previous) =>
      previous > 1 ? previous - 1 : 1
    );
  };

  const rating = Math.round(product.rating || 0);

  const discount =
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) /
            product.originalPrice) *
            100
        )
      : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    addToCart(product, selectedSize, quantity);

    alert(`${product.name} added to cart`);
  };

  return (
    <main className="product-details-page">

      {/* BREADCRUMB */}

      <div className="product-breadcrumb">

        <Link to="/">HOME</Link>

        <span> / </span>

        <Link to="/shop">SHOP</Link>

        <span> / </span>

        <span>{product.name}</span>

      </div>


      <div className="product-details-container">

        {/* PRODUCT IMAGE */}

        <div className="product-details-image">

          <img
            src={product.image}
            alt={product.name}
          />

          {discount > 0 && (
            <span className="details-sale-badge">
              {discount}% OFF
            </span>
          )}

          <span className="details-image-number">
            01
          </span>

        </div>


        {/* PRODUCT INFORMATION */}

        <div className="product-details-info">

          <div className="details-top">

            <p className="details-category">
              {product.category}
            </p>

            <button
              className="details-wishlist-button"
              onClick={() => toggleWishlist(product)}
            >
              {isInWishlist(product._id)
                ? "♥ SAVED"
                : "♡ SAVE"}
            </button>

          </div>


          <h1>{product.name}</h1>


          {/* RATING */}

          <div className="details-rating">

            <span className="details-stars">
              {"★".repeat(rating)}
              {"☆".repeat(5 - rating)}
            </span>

            <span>
              {product.rating || 0}
            </span>

            <span className="details-review-count">
              ({product.reviewCount || 0} reviews)
            </span>

          </div>


          {/* PRICE */}

          <div className="details-price-wrapper">

            <span className="details-price">
              ₹{product.price.toLocaleString("en-IN")}
            </span>

            {product.originalPrice > product.price && (
              <span className="details-original-price">
                ₹
                {product.originalPrice.toLocaleString(
                  "en-IN"
                )}
              </span>
            )}

          </div>


          <p className="details-short-description">
            Premium comfort and modern style designed
            for everyday wear.
          </p>


          <div className="details-divider"></div>


          {/* SIZE */}

          <div className="size-section">

            <div className="details-section-heading">

              <h3>SELECT SIZE</h3>

              <span>
                {selectedSize
                  ? `Selected: ${selectedSize}`
                  : "Choose a size"}
              </span>

            </div>


            <div className="size-options">

              {product.sizes?.map((size) => (

                <button
                  key={size}
                  className={
                    selectedSize === size
                      ? "selected-size"
                      : ""
                  }
                  onClick={() =>
                    setSelectedSize(size)
                  }
                >
                  {size}
                </button>

              ))}

            </div>

          </div>


          {/* QUANTITY */}

          <div className="quantity-section">

            <h3>QUANTITY</h3>

            <div className="quantity-control">

              <button
                onClick={decreaseQuantity}
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                onClick={increaseQuantity}
                aria-label="Increase quantity"
              >
                +
              </button>

            </div>

          </div>


          {/* ADD TO CART */}

          <button
            className="details-cart-button"
            onClick={handleAddToCart}
          >
            ADD TO CART
            <span>→</span>
          </button>


          {/* PRODUCT DETAILS */}

          <div className="details-description">

            <h3>PRODUCT DETAILS</h3>

            <p>
              Experience premium comfort and modern
              style with this Micky Mouse collection
              piece. Designed for everyday wear with
              quality materials and a comfortable fit.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}

export default ProductDetails;