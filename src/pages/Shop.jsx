import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

import { getProducts } from "../api/productApi";
import { useWishlist } from "../context/useWishlist";
import { useCart } from "../context/useCart";

import FlashSale from "../components/FlashSale";
import { animateToCart } from "../utils/cartAnimation";

import "./shop.css"

function Shop() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);

  const initialCategory = searchParams.get("category");

  const [category, setCategory] = useState(
    initialCategory
      ? initialCategory.charAt(0).toUpperCase() +
        initialCategory.slice(1)
      : "All"
  );

  const [maxPrice, setMaxPrice] = useState(5000);
  const [sort, setSort] = useState("default");
  const [gender, setGender] = useState("All");
  const [minRating, setMinRating] = useState(0);

  const categories = [
    "All",
    "Hoodies",
    "Shirts",
    "Pants",
    "T-Shirts",
    "New",
  ];

  const genders = [
    "All",
    "Men",
    "Women",
    "Unisex",
  ];

useEffect(() => {
  let isMounted = true;

  async function loadProducts() {
    try {
      const data = await getProducts();

      if (isMounted) {
        setProducts(data);
      }
    } catch (error) {
      if (isMounted) {
        setError("Failed to load products");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }

  loadProducts();

  const interval = setInterval(() => {
    loadProducts();
  }, 30000); // refresh every 30 seconds

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, []);

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category");

    setSearch(urlSearch);

    setCategory(
      urlCategory
        ? urlCategory.charAt(0).toUpperCase() +
          urlCategory.slice(1)
        : "All"
    );
  }, [searchParams]);

  const handleCategoryChange = (selectedCategory) => {
    setCategory(selectedCategory);

    if (selectedCategory === "All") {
      setSearchParams({});
    } else {
      setSearchParams({
        category: selectedCategory.toLowerCase(),
      });
    }
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        product.category === category;

      const matchesPrice =
        product.price <= maxPrice;

      const matchesGender =
        gender === "All" ||
        product.gender === gender;

      const matchesRating =
        Number(product.rating || 0) >= minRating;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesGender &&
        matchesRating
      );
    })
    .sort((a, b) => {
      if (sort === "low-high") {
        return a.price - b.price;
      }

      if (sort === "high-low") {
        return b.price - a.price;
      }

      if (sort === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }

      if (sort === "newest") {
        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      }

      if (sort === "discount") {
        const discountA =
          a.originalPrice > a.price
            ? ((a.originalPrice - a.price) /
                a.originalPrice) *
              100
            : 0;

        const discountB =
          b.originalPrice > b.price
            ? ((b.originalPrice - b.price) /
                b.originalPrice) *
              100
            : 0;

        return discountB - discountA;
      }

      return 0;
    });

  if (loading) {
    return (
      <main className="shop-page">
        <div className="shop-loading">
          <span>PLEASE WAIT</span>
          <h2>Loading Products...</h2>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="shop-page">
        <div className="shop-error">
          <span>ERROR</span>
          <h2>{error}</h2>
          <p>Please try again later.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="shop-page">

      {/* SHOP HEADER */}

      <section className="shop-header">

        <div className="shop-header-content">

          <p>
            SPACE WEAR • PREMIUM COLLECTION
          </p>

          <h1>SHOP</h1>

          <span>
            Discover premium clothing designed for
            everyday comfort and effortless style.
          </span>

        </div>

        <div className="shop-header-mark">
          <span>SW</span>
        </div>

      </section>


      {/* SHOP TOOLBAR */}

      <section className="shop-toolbar">

        <div className="search-box">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              const value = e.target.value;

              setSearch(value);

              if (value.trim()) {
                setSearchParams({
                  search: value,
                });
              } else {
                setSearchParams({});
              }
            }}
          />

          {search && (
            <button
              className="clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}

        </div>


        <div className="sort-box">

          <span>SORT</span>

          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value)
            }
          >

            <option value="default">
              Featured
            </option>

            <option value="low-high">
              Price: Low to High
            </option>

            <option value="high-low">
              Price: High to Low
            </option>

            <option value="rating">
              Highest Rated
            </option>

            <option value="newest">
              Newest Arrivals
            </option>

            <option value="discount">
              Biggest Discount
            </option>

          </select>

        </div>

      </section>


      {/* SHOP CONTENT */}

      <section className="shop-content">

        {/* SIDEBAR */}

        <aside className="shop-sidebar">

          <div className="filter-heading">

            <span>FILTERS</span>

            <span className="filter-line"></span>

          </div>


          <div className="filter-group">

            <h3>CATEGORIES</h3>

            <div className="category-filter">

              {categories.map((item) => (

                <button
                  key={item}
                  className={
                    category === item
                      ? "active-category"
                      : ""
                  }
                  onClick={() =>
                    handleCategoryChange(item)
                  }
                >

                  <span>{item}</span>

                  {category === item && (
                    <span>→</span>
                  )}

                </button>

              ))}

            </div>

          </div>


          <div className="filter-group">

            <h3>GENDER</h3>

            <div className="category-filter">

              {genders.map((item) => (

                <button
                  key={item}
                  className={
                    gender === item
                      ? "active-category"
                      : ""
                  }
                  onClick={() =>
                    setGender(item)
                  }
                >

                  <span>{item}</span>

                  {gender === item && (
                    <span>→</span>
                  )}

                </button>

              ))}

            </div>

          </div>


          <div className="filter-group">

            <h3>MINIMUM RATING</h3>

            <div className="rating-filter">

              {[0, 4, 3, 2].map((rating) => (

                <button
                  key={rating}
                  className={
                    minRating === rating
                      ? "active-rating"
                      : ""
                  }
                  onClick={() =>
                    setMinRating(rating)
                  }
                >

                  {rating === 0 ? (
                    "All Ratings"
                  ) : (
                    <>
                      {"★".repeat(rating)}

                      {"☆".repeat(
                        5 - rating
                      )}

                      <span>
                        & up
                      </span>
                    </>
                  )}

                </button>

              ))}

            </div>

          </div>


          <div className="price-filter">

            <div className="price-heading">

              <h3>MAX PRICE</h3>

              <span>
                ₹{maxPrice.toLocaleString("en-IN")}
              </span>

            </div>

            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(
                  Number(e.target.value)
                )
              }
            />

            <div className="price-range-labels">

              <span>₹500</span>

              <span>₹5,000</span>

            </div>

          </div>

        </aside>


        <FlashSale />


        {/* PRODUCTS */}

        <div className="shop-products">

          <div className="products-count">

            <span>

              {filteredProducts.length}{" "}

              {filteredProducts.length === 1
                ? "PRODUCT"
                : "PRODUCTS"}

            </span>


            <div className="active-filters">

              {category !== "All" && (
                <span className="active-filter">
                  {category}
                </span>
              )}

              {gender !== "All" && (
                <span className="active-filter">
                  {gender}
                </span>
              )}

              {minRating > 0 && (
                <span className="active-filter">
                  ★ {minRating}+
                </span>
              )}

              {maxPrice < 5000 && (
                <span className="active-filter">
                  ≤ ₹
                  {maxPrice.toLocaleString("en-IN")}
                </span>
              )}

            </div>

          </div>


          {filteredProducts.length === 0 ? (

            <div className="no-products">

              <span>NO RESULTS</span>

              <h2>No products found</h2>

              <p>
                Try changing your search or filters.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setMaxPrice(5000);
                  setSort("default");
                  setGender("All");
                  setMinRating(0);
                  setSearchParams({});
                }}
              >
                CLEAR ALL FILTERS →
              </button>

            </div>

          ) : (

            <div className="shop-product-grid">

              {filteredProducts.map(
                (product, index) => (

                  <Link
                    to={`/product/${product._id}`}
                    className="shop-product-card"
                    key={product._id}
                  >

                    <div className="shop-product-image">

                      <img
                        src={product.image}
                        alt={product.name}
                      />
                      {Number(product.stock) <= 0 && (
  <span className="out-of-stock-badge">
    OUT OF STOCK
  </span>
)}

                      <span className="product-index">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </span>


                      <button
                        className="shop-wishlist"
                        aria-label={
                          isInWishlist(
                            product._id
                          )
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        onClick={(e) => {

                          e.preventDefault();
                          e.stopPropagation();

                          toggleWishlist(product);

                        }}
                      >

                        {isInWishlist(
                          product._id
                        )
                          ? "♥"
                          : "♡"}

                      </button>


                      {product.originalPrice >
                        product.price && (
                        <span className="sale-badge">
                          SALE
                        </span>
                      )}

                    </div>


                    <div className="shop-product-info">

                      <p className="shop-category">
                        {product.category}
                      </p>

                      <h3>
                        {product.name}
                      </h3>


                      <div className="rating">

                        <span className="rating-stars">

                          {"★".repeat(
                            Math.round(
                              product.rating || 0
                            )
                          )}

                          {"☆".repeat(
                            5 -
                              Math.round(
                                product.rating || 0
                              )
                          )}

                        </span>


                        <span className="rating-count">

                          {product.rating || 0} (

                          {product.reviewCount || 0})

                        </span>

                      </div>


                      <div className="shop-product-price">

                        <span className="current-price">

                          ₹
                          {product.price.toLocaleString(
                            "en-IN"
                          )}

                        </span>


                        {product.originalPrice >
                          product.price && (
                          <>

                            <span className="original-price">

                              ₹
                              {product.originalPrice.toLocaleString(
                                "en-IN"
                              )}

                            </span>


                            <span className="discount">

                              {Math.round(
                                ((product.originalPrice -
                                  product.price) /
                                  product.originalPrice) *
                                  100
                              )}

                              % OFF

                            </span>

                          </>
                        )}

                      </div>


                      {/* ADD TO CART */}

                  {/* STOCK / ADD TO CART */}

{Number(product.stock) <= 0 ? (
  <button
    type="button"
    className="shop-cart-button out-of-stock-button"
    disabled
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
  >
    OUT OF STOCK
  </button>
) : (
 <button
  type="button"
  className="shop-cart-button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    if (Number(product.stock) <= 0) {
      return;
    }

    if (!product.sizes || product.sizes.length === 0) {
      alert("No sizes available for this product.");
      return;
    }

    // Open product details so customer can select size
    window.location.href = `/product/${product._id}`;
  }}
>
  ADD TO CART →
</button>
)}

                    </div>

                  </Link>

                )
              )}

            </div>

          )}

        </div>

      </section>

    </main>
  );
}

export default Shop;