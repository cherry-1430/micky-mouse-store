import { Link } from "react-router-dom";

function PromoBanner() {
  return (
    <section className="promo-banner">

      <div className="promo-content">

        <p className="promo-small-text">
          MICKEY MOUSE • NEW SEASON
        </p>

        <h2>
          MAKE EVERY
          <br />
          DAY
          <span> ICONIC.</span>
        </h2>

        <p className="promo-description">
          Discover our latest collection of premium
          clothing inspired by timeless Mickey Mouse style.
          Made for everyday comfort and effortless confidence.
        </p>

        <Link
          to="/shop"
          className="promo-button"
        >
          EXPLORE COLLECTION →
        </Link>

      </div>

      <div className="promo-decoration">
        <span>MM</span>
      </div>

    </section>
  );
}

export default PromoBanner;

