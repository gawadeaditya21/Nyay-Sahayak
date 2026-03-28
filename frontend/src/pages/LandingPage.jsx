import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
    </>
  );
}