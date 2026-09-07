import Hero from "../components/Hero";
import CategorySection from "../components/CategorySection";
import ProductSection from "../components/ProductSection";
import PromoBanner from "../components/PromoBanner";
import WhyChooseUs from "../components/WhyChooseUs";
import Newsletter from "../components/Newsletter";
import FlashSale from "../components/FlashSale";
import RecentlyViewed from "../components/RecentlyViewed";

function Home() {
  return (
    <main className="home-page">
      <Hero />

      <CategorySection />

      <FlashSale />

      <ProductSection />

      <PromoBanner />

      <WhyChooseUs />

      <RecentlyViewed />

      <Newsletter />
    </main>
  );
}

export default Home;