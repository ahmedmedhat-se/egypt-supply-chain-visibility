import { Card } from '../ui/Card';
import { FaShieldAlt, FaDatabase, FaUserSecret, FaCookie, FaEnvelope, FaGlobe, FaLock, FaUserCog } from 'react-icons/fa';

export const PrivacyPage = () => {
  const sections = [
    {
      icon: FaShieldAlt,
      title: '1. Information We Collect',
      content: `We collect information to provide and improve the ESCV platform. This includes: (a) Personal information you provide during registration (name, email, phone number, organization details), (b) Shipment data you submit for tracking, (c) Technical information automatically collected (IP address, browser type, device information, usage patterns), and (d) Location data for GPS tracking when you opt to share it.`
    },
    {
      icon: FaDatabase,
      title: '2. How We Use Your Information',
      content: `Your information is used to: (a) provide and maintain the ESCV platform, (b) enable real-time shipment tracking and visibility, (c) send notifications about shipment status updates, alerts, and platform announcements, (d) improve our services through analytics and user feedback, (e) comply with legal and regulatory requirements, and (f) ensure platform security and prevent fraud.`
    },
    {
      icon: FaUserSecret,
      title: '3. Data Sharing & Disclosure',
      content: `We do not sell your personal data. Your information may be shared with: (a) organizations you are affiliated with as part of the supply chain ecosystem, (b) regulatory authorities as required by Egyptian law, (c) service providers who assist in platform operations (hosting, email delivery, analytics), and (d) parties with your explicit consent. All third parties are bound by strict confidentiality agreements.`
    },
    {
      icon: FaCookie,
      title: '4. Cookies & Tracking Technologies',
      content: `We use cookies and similar technologies to enhance your experience. Cookies help us remember your preferences, maintain your session, and analyze platform usage. You can control cookie settings through your browser preferences. Essential cookies are required for platform functionality and cannot be disabled.`
    },
    {
      icon: FaLock,
      title: '5. Data Security Measures',
      content: `We implement industry-standard security measures including: (a) Encryption in transit (TLS/SSL), (b) Encryption at rest, (c) Access controls and role-based permissions, (d) Regular security audits and penetration testing, (e) Bcrypt password hashing, and (f) JWT tokens with short expiry times. Despite our efforts, no method of transmission over the internet is 100% secure.`
    },
    {
      icon: FaEnvelope,
      title: '6. Your Rights & Choices',
      content: `Under Egyptian law and applicable regulations, you have the right to: (a) access your personal data, (b) correct inaccurate information, (c) request deletion of your data (subject to legal obligations), (d) opt out of marketing communications, (e) withdraw consent for processing, and (f) data portability. To exercise these rights, contact us at support@escv.com. We will respond within 30 days.`
    },
    {
      icon: FaUserCog,
      title: '7. Data Retention',
      content: `We retain your personal data for as long as your account is active and for a reasonable period thereafter to comply with legal obligations, resolve disputes, and enforce our agreements. Shipment data is retained for audit and reporting purposes in accordance with Egyptian trade regulations. You may request data deletion at any time.`
    },
    {
      icon: FaGlobe,
      title: '8. International Data Transfers',
      content: `Your data may be transferred to and processed in countries outside Egypt where our service providers operate. We ensure appropriate safeguards are in place, including standard contractual clauses approved by relevant authorities, to protect your data in accordance with applicable laws.`
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2E4A] to-[#1A3D5A] p-8 md:p-10 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <FaShieldAlt className="w-6 h-6 text-[#2D9B6E]" />
            <span className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Legal Document</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-[#94A3B8] max-w-2xl">
            Your privacy matters to us. This Privacy Policy explains how we collect, use, and protect your personal information on the ESCV platform.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-[#94A3B8]">
            <span>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="hidden sm:inline">•</span>
            <span>Version 1.0</span>
            <span className="hidden sm:inline">•</span>
            <span>🇪🇬 Compliant with Egyptian Law</span>
          </div>
        </div>
        <div className="absolute -right-16 -bottom-16 opacity-10">
          <FaShieldAlt className="text-[200px] md:text-[250px]" />
        </div>
      </section>

      {/* Content */}
      <Card variant="elevated" className="p-6 md:p-8">
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="border-b border-[#E2E8F0] dark:border-[#1A3D5A] last:border-0 pb-6 last:pb-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <section.icon className="w-5 h-5 text-[#2D9B6E]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-2">
                    {section.title}
                  </h3>
                  <p className="text-[#1A2A3A] dark:text-[#94A3B8] leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="elevated" className="p-6 text-center">
          <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
            Questions about our Privacy Policy?
          </p>
          <a
            href="mailto:privacy@escv.com"
            className="inline-block mt-2 text-[#2D9B6E] font-medium hover:underline"
          >
            privacy@escv.com
          </a>
        </Card>
        <Card variant="elevated" className="p-6 text-center">
          <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
            Also review our Terms of Service
          </p>
          <a
            href="/terms"
            className="inline-block mt-2 text-[#2D9B6E] font-medium hover:underline"
          >
            Terms of Service
          </a>
        </Card>
      </div>
    </div>
  );
};