import { useState } from "react";

function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) return;

    alert("Thank you for subscribing!");
    setEmail("");
  };

  return (
    <section className="newsletter">
      <div className="newsletter-content">

        <p className="newsletter-small">
          MICKEY MOUSE • NEWSLETTER
        </p>

        <h2>
          STAY IN THE
          <br />
          <span>LOOP.</span>
        </h2>

        <p className="newsletter-description">
          Subscribe for new collections, exclusive offers and
          the latest Micky Mouse updates.
        </p>

        <form
          className="newsletter-form"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit">
            SUBSCRIBE →
          </button>
        </form>

        <p className="newsletter-note">
          By subscribing, you agree to receive updates from Micky Mouse.
        </p>

      </div>

      <div className="newsletter-decoration">
        <span>MM</span>
      </div>
    </section>
  );
}

export default Newsletter;