function WhyChooseUs() {
  const features = [
    {
      icon: "🚚",
      title: "FAST DELIVERY",
      description:
        "Get your favorite Micky Mouse products delivered quickly to your doorstep.",
    },
    {
      icon: "↩",
      title: "EASY RETURNS",
      description:
        "Shop with confidence with our simple and hassle-free return process.",
    },
    {
      icon: "🔒",
      title: "SECURE PAYMENT",
      description:
        "Your payments are protected with secure and trusted payment methods.",
    },
    {
      icon: "✦",
      title: "PREMIUM QUALITY",
      description:
        "We focus on quality fabrics, comfortable fits and premium finishing.",
    },
  ];

  return (
    <section className="why-section">
      <div className="section-heading">
        <p>THE SPACE WEAR PROMISE</p>
        <h2>WHY CHOOSE US?</h2>
        <span>
          Everything you need for a simple, secure and enjoyable shopping
          experience.
        </span>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-card" key={feature.title}>
            <div className="feature-top">
              <span className="feature-number">0{index + 1}</span>

              <div className="feature-icon">
                {feature.icon}
              </div>
            </div>

            <div className="feature-content">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>

            <div className="feature-line"></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WhyChooseUs;