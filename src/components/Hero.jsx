import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero">

      {/* Left Content */}
      <div className="hero-content">

        <p className="hero-small-text">
          SPACEWEAR • PREMIUM COLLECTION
        </p>

        <h1>
          WEAR
          <br />
          BEYOND
          <br />
          <span>ORDINARY.</span>
        </h1>

        <p className="hero-description">
          Discover premium clothing inspired by the
          timeless personality of Space Wear —
          designed for comfort, confidence and everyday style.
        </p>

        <div className="hero-actions">
          <Link to="/shop" className="hero-button">
            SHOP COLLECTION
          </Link>

          <Link to="/shop?category=new" className="hero-secondary-button">
            NEW ARRIVALS →
          </Link>
        </div>

        <div className="hero-features">
          <div>
            <strong>PREMIUM</strong>
            <span>Quality materials</span>
          </div>

          <div>
            <strong>ORIGINAL</strong>
            <span>Unique designs</span>
          </div>

          <div>
            <strong>COMFORT</strong>
            <span>Made for everyday</span>
          </div>
        </div>

      </div>

      {/* Right Image */}
      <div className="hero-image">

        <img
          src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3"
          alt="Premium men's clothing"
        />

        <div className="hero-image-label">
          <span>MM</span>
          <p>THE NEW<br />COLLECTION</p>
        </div>

      </div>

    </section>
  );
}

export default Hero;

