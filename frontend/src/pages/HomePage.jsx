import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../layouts/Header';
import Footer from '../layouts/Footer';
import Hero from '../components/Hero';
import Services from '../components/Services';
import WhyChooseUs from '../components/WhyChooseUs';
import About from '../components/About';
import Contact from '../components/Contact';

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const scrollToServices = () => {
    const servicesElement = document.getElementById('services');
    if (servicesElement) {
      servicesElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flexGrow: 1 }}>
        <Hero onExploreClick={scrollToServices} />
        <Services />
        <WhyChooseUs />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
