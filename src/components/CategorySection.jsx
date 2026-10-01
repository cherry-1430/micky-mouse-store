import { Link } from "react-router-dom";

import "./categorySection.css"

function CategorySection() {
  const categories = [
    {
      name: "Hoodies",
      slug: "hoodies",
      image:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Shirts",
      slug: "shirts",
      image:
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Pants",
      slug: "pants",
      image:
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <section className="category-section">

      {/* HEADING */}
      <div className="section-heading">
        <p>EXPLORE OUR COLLECTION</p>

        <h2>SHOP BY CATEGORY</h2>

        <span>
          Find the perfect pieces for your everyday style.
        </span>
      </div>

      {/* CATEGORY GRID */}
      <div className="category-grid">

        {categories.map((category, index) => (
          <Link
            key={category.slug}
            to={`/shop?category=${category.slug}`}
            className="category-card"
          >

            {/* IMAGE */}
            <div className="category-image">

              <img
                src={category.image}
                alt={`${category.name} collection`}
                loading="lazy"
                decoding="async"
              />

            </div>

            {/* NUMBER */}
            <div className="category-number">
              {String(index + 1).padStart(2, "0")}
            </div>

            {/* OVERLAY */}
            <div className="category-overlay">

              <div>
                <p>COLLECTION</p>

                <h3>{category.name}</h3>
              </div>

              <span className="category-arrow">
                →
              </span>

            </div>

          </Link>
        ))}

      </div>

    </section>
  );
}

export default CategorySection;