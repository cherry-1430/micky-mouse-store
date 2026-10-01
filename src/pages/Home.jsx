import { useEffect } from "react";

import Hero from "../components/Hero";
import CategorySection from "../components/CategorySection";
import ProductSection from "../components/ProductSection";
import PromoBanner from "../components/PromoBanner";
import WhyChooseUs from "../components/WhyChooseUs";
import Newsletter from "../components/Newsletter";
import FlashSale from "../components/FlashSale";
import RecentlyViewed from "../components/RecentlyViewed";

import "./Home.css"

function Home() {
  useEffect(() => {
    const sections = document.querySelectorAll(".sw-reveal");

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sw-reveal-show");

            // Once visible, stop observing it.
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main className="home-page">

      <section className="sw-reveal">
        <Hero />
      </section>

      <section className="sw-reveal">
        <CategorySection />
      </section>

      <section className="sw-reveal">
        <FlashSale />
      </section>

      <section className="sw-reveal">
        <ProductSection />
      </section>

      <section className="sw-reveal">
        <PromoBanner />
      </section>

      <section className="sw-reveal">
        <WhyChooseUs />
      </section>

      <section className="sw-reveal">
        <RecentlyViewed />
      </section>

      <section className="sw-reveal">
        <Newsletter />
      </section>

    </main>
  );
}

export default Home;