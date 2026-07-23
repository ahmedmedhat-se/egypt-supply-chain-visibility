import { Link } from 'react-router-dom';
import { FaShip, FaMapMarkedAlt, FaBell, FaChartLine, FaShieldAlt, FaGlobe } from 'react-icons/fa';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';

const features = [
  {
    icon: FaShip,
    title: 'Real-time Tracking',
    description: 'Track your shipments live with GPS-powered updates and instant status changes.',
    color: 'text-[#2D9B6E]',
    bg: 'bg-[#D1FAE5] dark:bg-[#1F7A52]/30',
  },
  {
    icon: FaMapMarkedAlt,
    title: 'Interactive Maps',
    description: 'Visualize your supply chain with dynamic maps showing every shipment location.',
    color: 'text-[#0A2E4A] dark:text-white',
    bg: 'bg-[#E8F0F8] dark:bg-[#1A3D5A]',
  },
  {
    icon: FaBell,
    title: 'Smart Alerts',
    description: 'Get instant notifications about delays, customs holds, and route changes.',
    color: 'text-[#F59E0B]',
    bg: 'bg-[#FEF3C7] dark:bg-[#92400E]/30',
  },
  {
    icon: FaChartLine,
    title: 'Analytics Dashboard',
    description: 'Make data-driven decisions with comprehensive supply chain analytics.',
    color: 'text-[#1E40AF] dark:text-[#60A5FA]',
    bg: 'bg-[#DBEAFE] dark:bg-[#1E40AF]/30',
  },
  {
    icon: FaShieldAlt,
    title: 'Secure Platform',
    description: 'Enterprise-grade security with role-based access control and encrypted data.',
    color: 'text-[#DC2626] dark:text-[#F87171]',
    bg: 'bg-[#FEE2E2] dark:bg-[#991B1B]/30',
  },
  {
    icon: FaGlobe,
    title: 'National Visibility',
    description: 'Complete overview of Egypt\'s supply chain across all ports and routes.',
    color: 'text-[#0A2E4A] dark:text-white',
    bg: 'bg-[#E8F0F8] dark:bg-[#1A3D5A]',
  },
];

export const HomePage = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2E4A] to-[#1A3D5A] p-8 md:p-12 text-white">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Egypt Supply Chain Visibility
          </h1>
          <p className="text-lg text-[#94A3B8] dark:text-[#94A3B8] mb-6">
            Bringing real-time transparency to Egypt's trade and logistics ecosystem. 
            Track shipments, monitor ports, and optimize your supply chain.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to={ROUTES.REGISTER}>
              <Button size="lg" className="bg-[#2D9B6E] hover:bg-[#1F7A52]">
                Get Started
              </Button>
            </Link>
            <Link to={ROUTES.ABOUT}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10">
          <FaShip className="text-[200px] md:text-[300px]" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Shipments', value: '12,847' },
          { label: 'Ports Connected', value: '8' },
          { label: 'Happy Users', value: '2,341' },
          { label: 'Uptime', value: '99.9%' },
        ].map((stat) => (
          <Card key={stat.label} variant="elevated" className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-[#0A2E4A] dark:text-white">{stat.value}</p>
            <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">{stat.label}</p>
          </Card>
        ))}
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A2E4A] dark:text-white">
            Why Choose ESCV?
          </h2>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-2">
            Everything you need for complete supply chain visibility
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} variant="elevated" className="group hover:scale-105 transition-transform duration-300">
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', feature.bg)}>
                <feature.icon className={cn('w-6 h-6', feature.color)} />
              </div>
              <h3 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center p-8 md:p-12 rounded-2xl bg-[#E8F0F8] dark:bg-[#1A3D5A]">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0A2E4A] dark:text-white mb-4">
          Ready to Transform Your Supply Chain?
        </h2>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mb-6 max-w-2xl mx-auto">
          Join thousands of shippers, carriers, and regulators who trust ESCV for real-time supply chain visibility.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to={ROUTES.REGISTER}>
            <Button size="lg" className="bg-[#2D9B6E] hover:bg-[#1F7A52]">
              Create Free Account
            </Button>
          </Link>
          <Link to={ROUTES.CONTACT}>
            <Button size="lg" variant="outline" className="border-[#0A2E4A] dark:border-white text-[#0A2E4A] dark:text-white hover:bg-[#0A2E4A] dark:hover:bg-white hover:text-white dark:hover:text-[#0A2E4A]">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};