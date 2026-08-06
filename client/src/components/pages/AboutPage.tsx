import { FaShip, FaGlobe, FaShieldAlt, FaChartLine, FaRocket } from 'react-icons/fa';
import { cn } from '../../lib/utils';

const features = [
  {
    icon: FaShip,
    title: 'Real-time Tracking',
    description: 'GPS-powered live tracking with instant status updates for every shipment.',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: FaGlobe,
    title: 'National Coverage',
    description: 'Complete visibility across all Egyptian ports, customs, and logistics hubs.',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    iconColor: 'text-green-500',
  },
  {
    icon: FaShieldAlt,
    title: 'Enterprise Security',
    description: 'Role-based access control with encrypted data and secure authentication.',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    iconColor: 'text-purple-500',
  },
  {
    icon: FaChartLine,
    title: 'Analytics & Insights',
    description: 'Data-driven decisions with comprehensive supply chain analytics and reports.',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    iconColor: 'text-orange-500',
  },
];

export const AboutPage = () => {
  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2E4A] via-[#1A3D5A] to-[#2D5A7A] p-8 sm:p-10 lg:p-14 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-12 bg-[#2D9B6E] rounded-full" />
            <span className="text-sm font-semibold text-[#2D9B6E] uppercase tracking-wider">About Us</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Empowering Egypt's <span className="text-[#2D9B6E]">Supply Chain</span>
          </h1>
          <p className="text-base sm:text-lg text-[#94A3B8] dark:text-[#94A3B8] leading-relaxed max-w-xl">
            Egypt Supply Chain Visibility (ESCV) is transforming how businesses track, manage, and optimize their 
            logistics operations across the nation.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-[#2D9B6E] rounded-full animate-pulse" />
              <span className="text-sm text-[#E2E8F0]">Real-time tracking</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-[#2D9B6E] rounded-full animate-pulse" />
              <span className="text-sm text-[#E2E8F0]">100+ companies</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-5">
          <FaGlobe className="text-[200px] sm:text-[300px] lg:text-[400px]" />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2D9B6E]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
      </section>

      {/* Mission & Vision */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#0F2A44] rounded-2xl p-6 sm:p-8 border-2 border-[#E2E8F0] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] transition-all duration-300 hover:shadow-xl hover:shadow-[#2D9B6E]/10 dark:hover:shadow-[#2D9B6E]/5 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2D9B6E]/10 dark:bg-[#2D9B6E]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FaRocket className="w-5 h-5 text-[#2D9B6E]" />
              </div>
              <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white">Our Mission</h2>
            </div>
            <p className="text-[#1A2A3A] dark:text-[#94A3B8] leading-relaxed">
              To modernize Egypt's supply chain infrastructure by providing a unified, real-time visibility platform 
              that connects shippers, carriers, and regulators across the nation.
            </p>
            <div className="mt-4 w-12 h-1 bg-[#2D9B6E] rounded-full group-hover:w-20 transition-all duration-300" />
          </div>

          <div className="bg-white dark:bg-[#0F2A44] rounded-2xl p-6 sm:p-8 border-2 border-[#E2E8F0] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] transition-all duration-300 hover:shadow-xl hover:shadow-[#2D9B6E]/10 dark:hover:shadow-[#2D9B6E]/5 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2D9B6E]/10 dark:bg-[#2D9B6E]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FaGlobe className="w-5 h-5 text-[#2D9B6E]" />
              </div>
              <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white">Our Vision</h2>
            </div>
            <p className="text-[#1A2A3A] dark:text-[#94A3B8] leading-relaxed">
              A fully transparent, efficient, and resilient Egyptian supply chain that drives economic growth 
              and positions Egypt as a global logistics leader.
            </p>
            <div className="mt-4 w-12 h-1 bg-[#2D9B6E] rounded-full group-hover:w-20 transition-all duration-300" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-0.5 bg-[#2D9B6E]" />
            <span className="text-sm font-semibold text-[#2D9B6E] uppercase tracking-wider">Why Choose ESCV</span>
            <div className="w-12 h-0.5 bg-[#2D9B6E]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2E4A] dark:text-white">
            Built for <span className="text-[#2D9B6E]">Modern Logistics</span>
          </h2>
          <p className="text-[#94A3B8] dark:text-[#64748B] mt-2 max-w-2xl mx-auto">
            Everything you need to track, manage, and optimize your supply chain operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-white dark:bg-[#0F2A44] rounded-2xl p-6 sm:p-8 border-2 border-[#E2E8F0] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] transition-all duration-300 hover:shadow-xl hover:shadow-[#2D9B6E]/10 dark:hover:shadow-[#2D9B6E]/5 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
                  feature.bgColor
                )}>
                  <feature.icon className={cn('w-7 h-7', feature.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[#0A2E4A] dark:text-white group-hover:text-[#2D9B6E] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8] leading-relaxed mt-1">
                    {feature.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs font-medium text-[#2D9B6E]">Learn more</span>
                    <svg className="w-3 h-3 text-[#2D9B6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D9B6E] to-[#1F7A52] p-8 sm:p-10 lg:p-12 text-white text-center">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-[#D1FAE5] text-sm sm:text-base leading-relaxed">
            Join hundreds of companies already using ESCV to transform their supply chain operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#2D9B6E] font-semibold rounded-xl hover:bg-[#F0FDF4] transition-all duration-300 shadow-lg shadow-[#1F7A52]/30 hover:shadow-xl hover:shadow-[#1F7A52]/40 hover:-translate-y-0.5"
            >
              Start Free Trial
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 hover:border-white hover:-translate-y-0.5"
            >
              Contact Sales
            </a>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </section>
    </div>
  );
};