import { Card } from '../ui/Card';
import { FaShip, FaGlobe, FaShieldAlt, FaChartLine } from 'react-icons/fa';

export const AboutPage = () => {
  const stats = [
    { label: 'Active Shipments', value: '12,847+' },
    { label: 'Ports Connected', value: '8' },
    { label: 'Happy Users', value: '2,341+' },
    { label: 'Uptime', value: '99.9%' },
  ];

  const features = [
    {
      icon: FaShip,
      title: 'Real-time Tracking',
      description: 'GPS-powered live tracking with instant status updates for every shipment.',
    },
    {
      icon: FaGlobe,
      title: 'National Coverage',
      description: 'Complete visibility across all Egyptian ports, customs, and logistics hubs.',
    },
    {
      icon: FaShieldAlt,
      title: 'Enterprise Security',
      description: 'Role-based access control with encrypted data and secure authentication.',
    },
    {
      icon: FaChartLine,
      title: 'Analytics & Insights',
      description: 'Data-driven decisions with comprehensive supply chain analytics and reports.',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2E4A] to-[#1A3D5A] p-8 md:p-12 text-white">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About ESCV</h1>
          <p className="text-lg text-[#94A3B8] dark:text-[#94A3B8]">
            Egypt Supply Chain Visibility — bringing real-time transparency to Egypt's trade and logistics ecosystem.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10">
          <FaGlobe className="text-[200px] md:text-[300px]" />
        </div>
      </section>

      {/* Mission */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card variant="elevated">
            <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-3">Our Mission</h2>
            <p className="text-[#1A2A3A] dark:text-[#94A3B8] leading-relaxed">
              To modernize Egypt's supply chain infrastructure by providing a unified, real-time visibility platform 
              that connects shippers, carriers, and regulators across the nation.
            </p>
          </Card>
          <Card variant="elevated">
            <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-3">Our Vision</h2>
            <p className="text-[#1A2A3A] dark:text-[#94A3B8] leading-relaxed">
              A fully transparent, efficient, and resilient Egyptian supply chain that drives economic growth 
              and positions Egypt as a global logistics leader.
            </p>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} variant="elevated" className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#0A2E4A] dark:text-white">{stat.value}</p>
              <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">{stat.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-[#0A2E4A] dark:text-white text-center mb-8">Why ESCV?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} variant="elevated" className="group hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 rounded-lg bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[#2D9B6E]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};