import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Brand */}

        <div className="footer-brand">

          <Link to="/" className="footer-logo">
            <span>Space</span>
            <span>Wear</span>
          </Link>

          <p>
            Premium men's clothing designed
            for modern style and confidence.
          </p>

          <div className="footer-brand-line"></div>

          <span className="footer-tagline">
            WEAR YOUR CHARACTER.
          </span>

        </div>


        {/* Shop */}

        <div className="footer-column">

          <h3>SHOP</h3>

          <Link to="/shop?category=hoodies">Hoodies</Link>
          <Link to="/shop?category=shirts">Shirts</Link>
          <Link to="/shop?category=pants">Pants</Link>
          <Link to="/shop?category=t-shirts">T-Shirts</Link>
          <Link to="/shop?category=new">New Arrivals</Link>

        </div>


        {/* Customer Service */}

        {/* Customer Service */}

<div className="footer-column">

  <h3>CUSTOMER SERVICE</h3>

  <Link to="/contact">Contact Us</Link>
  <Link to="/shipping">Shipping</Link>
  <Link to="/returns">Returns</Link>
  <Link to="/faq">FAQ</Link>

  <a href="tel:+918688243239">
    📞 8688243239
  </a>

  <a href="mailto:mickymouse14@gmail.com">
    ✉ spacewear14@gmail.com
  </a>
  <a
  href="https://wa.me/918688243239?text=Hello%2C%20I%20need%20help%20with%20my%20order."
  target="_blank"
  rel="noopener noreferrer"
>
  💬 WhatsApp
</a>

<p className="footer-contact-info">
  📍 Anakapalle, Tarak Rama Colony
</p>

<p className="footer-contact-info">
  🕒 Open 24/7
</p>

</div>


        {/* Social */}

        <div className="footer-column">

          <h3>FOLLOW US</h3>

          <a href="#" aria-label="Instagram">Instagram ↗</a>
          <a href="#" aria-label="Facebook">Facebook ↗</a>
          <a href="#" aria-label="YouTube">YouTube ↗</a>

        </div>

      </div>


      {/* Bottom */}

      <div className="footer-bottom">

        <p>
          © 2026 Micky Mouse. All rights reserved.
        </p>

        <div className="footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms & Conditions</a>
        </div>

        <span className="footer-country">
          MADE FOR EVERYDAY STYLE
        </span>

      </div>

    </footer>
  );
}

export default Footer;