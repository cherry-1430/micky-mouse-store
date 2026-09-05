import { Link } from "react-router-dom";

function CategorySection() {
  const categories = [
    {
      name: "Hoodies",
      slug: "hoodies",
      image:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
    },
    {
      name: "Shirts",
      slug: "shirts",
      image:
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf",
    },
    {
      name: "Pants",
      slug: "pants",
      image:
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80",
    },
  ];

  return (
    <section className="category-section">

      <div className="section-heading">
        <p>EXPLORE OUR COLLECTION</p>

        <h2>SHOP BY CATEGORY</h2>

        <span>
          Find the perfect pieces for your everyday style.
        </span>
      </div>

      <div className="category-grid">

        {categories.map((category, index) => (
          <Link
            to={`/shop?category=${category.slug}`}
            className="category-card"
            key={category.name}
          >

            <img
              src={category.image}
              alt={category.name}
            />

            <div className="category-number">
              0{index + 1}
            </div>

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

