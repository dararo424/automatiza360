import { I18nProvider } from './hooks/useI18n';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SocialProof } from './components/SocialProof';
import { HowItWorks } from './components/HowItWorks';
import { DemoChatSection } from './components/DemoChatSection';
import { Features } from './components/Features';
import { Industries } from './components/Industries';
import { Pricing } from './components/Pricing';
import { Competitors } from './components/Competitors';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <I18nProvider>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <DemoChatSection />
        <Features />
        <Industries />
        <Pricing />
        <Competitors />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </I18nProvider>
  );
}
