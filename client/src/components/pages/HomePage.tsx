import { Link } from 'react-router-dom';
import { FaBell, FaChartLine, FaGlobe, FaMapMarkedAlt, FaShieldAlt, FaShip, FaArrowRight, FaCheckCircle, FaRocket } from 'react-icons/fa';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';

const features = [
  {
    icon: FaShip,
    title: 'Real-time Tracking',
    description: 'Track your shipments live with GPS-powered updates and instant status changes.',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: FaMapMarkedAlt,
    title: 'Interactive Maps',
    description: 'Visualize your supply chain with dynamic maps showing every shipment location.',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    iconColor: 'text-green-500',
  },
  {
    icon: FaBell,
    title: 'Smart Alerts',
    description: 'Get instant notifications about delays, customs holds, and route changes.',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    iconColor: 'text-yellow-500',
  },
  {
    icon: FaChartLine,
    title: 'Analytics Dashboard',
    description: 'Make data-driven decisions with comprehensive supply chain analytics.',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    iconColor: 'text-purple-500',
  },
  {
    icon: FaShieldAlt,
    title: 'Secure Platform',
    description: 'Enterprise-grade security with role-based access control and encrypted data.',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    iconColor: 'text-red-500',
  },
  {
    icon: FaGlobe,
    title: 'National Visibility',
    description: 'Complete overview of Egypt\'s supply chain across all ports and routes.',
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/20',
    iconColor: 'text-teal-500',
  },
];

export const HomePage = () => {
  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2E4A] via-[#1A3D5A] to-[#2D5A7A] p-8 sm:p-10 lg:p-14 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-12 bg-[#2D9B6E] rounded-full" />
            <span className="text-sm font-semibold text-[#2D9B6E] uppercase tracking-wider">Welcome to ESCV</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight">
            Egypt Supply Chain <span className="text-[#2D9B6E]">Visibility</span>
          </h1>
          <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-xl">
            Bringing real-time transparency to Egypt's trade and logistics ecosystem. 
            Track shipments, monitor ports, and optimize your supply chain.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link to={ROUTES.REGISTER}>
              <button className="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-[#2D9B6E] hover:bg-[#1F7A52] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#2D9B6E]/30 hover:shadow-xl hover:shadow-[#2D9B6E]/40 hover:-translate-y-0.5">
                Get Started
                <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </Link>
            <Link to={ROUTES.ABOUT}>
              <button className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/50 hover:border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5">
                Learn More
              </button>
            </Link>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-5">
          <FaShip className="text-[200px] sm:text-[300px] lg:text-[400px]" />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2D9B6E]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
        
        {/* Floating badges */}
        <div className="absolute top-8 right-8 hidden lg:flex flex-col gap-2">
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-right duration-500">
            <div className="w-2 h-2 bg-[#2D9B6E] rounded-full animate-pulse" />
            <span className="text-xs text-[#E2E8F0]">Live Tracking Active</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-right duration-700">
            <FaCheckCircle className="w-3 h-3 text-[#2D9B6E]" />
            <span className="text-xs text-[#E2E8F0]">100% Uptime</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-0.5 bg-[#2D9B6E]" />
            <span className="text-sm font-semibold text-[#2D9B6E] uppercase tracking-wider">Features</span>
            <div className="w-12 h-0.5 bg-[#2D9B6E]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2E4A] dark:text-white">
            Why Choose <span className="text-[#2D9B6E]">ESCV</span>?
          </h2>
          <p className="text-[#94A3B8] dark:text-[#64748B] mt-2 max-w-2xl mx-auto">
            Everything you need for complete supply chain visibility in one platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-white dark:bg-[#0F2A44] rounded-2xl p-6 sm:p-8 border-2 border-[#E2E8F0] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] transition-all duration-300 hover:shadow-xl hover:shadow-[#2D9B6E]/10 dark:hover:shadow-[#2D9B6E]/5 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
                feature.bgColor
              )}>
                <feature.icon className={cn('w-7 h-7', feature.iconColor)} />
              </div>
              <h3 className="text-lg font-bold text-[#0A2E4A] dark:text-white group-hover:text-[#2D9B6E] transition-colors mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8] leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs font-medium text-[#2D9B6E]">Learn more</span>
                <FaArrowRight className="w-3 h-3 text-[#2D9B6E] group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D9B6E] to-[#1F7A52] p-8 sm:p-10 lg:p-12 text-white text-center">
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <FaRocket className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Ready to Transform Your Supply Chain?
          </h2>
          <p className="text-[#D1FAE5] text-sm sm:text-base leading-relaxed">
            Join shippers, carriers, and regulators who trust ESCV for real-time supply chain visibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link to={ROUTES.REGISTER}>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#2D9B6E] font-semibold rounded-xl hover:bg-[#F0FDF4] transition-all duration-300 shadow-lg shadow-[#1F7A52]/30 hover:shadow-xl hover:shadow-[#1F7A52]/40 hover:-translate-y-0.5 w-full sm:w-auto">
                Create Free Account
                <FaArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to={ROUTES.CONTACT}>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 hover:border-white hover:-translate-y-0.5 w-full sm:w-auto">
                Contact Us
              </button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="w-4 h-4 text-[#D1FAE5]" />
              <span className="text-sm text-[#D1FAE5]">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="w-4 h-4 text-[#D1FAE5]" />
              <span className="text-sm text-[#D1FAE5]">14-day free trial</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </section>
    </div>
  );
};