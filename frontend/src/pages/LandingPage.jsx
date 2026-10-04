import LandingNav from '../components/landing/LandingNav.jsx';
import Hero from '../components/landing/Hero.jsx';
import ValueLoop from '../components/landing/ValueLoop.jsx';
import Features from '../components/landing/Features.jsx';
import AlertsShowcase from '../components/landing/AlertsShowcase.jsx';
import ProviderNetwork from '../components/landing/ProviderNetwork.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import ClosingCta from '../components/landing/ClosingCta.jsx';
import LandingFooter from '../components/landing/LandingFooter.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-full bg-canvas">
      <LandingNav />
      <main>
        <Hero />
        <ValueLoop />
        <Features />
        <AlertsShowcase />
        <ProviderNetwork />
        <HowItWorks />
        <ClosingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
