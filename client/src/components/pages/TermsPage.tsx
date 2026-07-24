import { Card } from '../ui/Card';
import { FaGavel, FaShieldAlt, FaUserCheck, FaDatabase, FaBan, FaFileContract, FaClock } from 'react-icons/fa';

export const TermsPage = () => {
  const sections = [
    {
      icon: FaGavel,
      title: '1. Acceptance of Terms',
      content: `By accessing or using the Egypt Supply Chain Visibility (ESCV) platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you must not use our platform.`
    },
    {
      icon: FaUserCheck,
      title: '2. User Accounts & Registration',
      content: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use. Accounts are role-based (Shipper, Carrier, Regulator, Admin) and access is strictly enforced by our Role-Based Access Control system.`
    },
    {
      icon: FaDatabase,
      title: '3. Data Ownership & Usage',
      content: `All shipment data, user information, and platform content remain the property of their respective owners. You retain ownership of data you submit, but grant ESCV a non-exclusive license to process, store, and display it for platform functionality. Our Privacy Policy governs how we handle your personal information.`
    },
    {
      icon: FaShieldAlt,
      title: '4. Acceptable Use Policy',
      content: `You agree to use ESCV solely for legitimate supply chain visibility purposes. You may not: (a) transmit malware or harmful code, (b) attempt unauthorized access to other users' data, (c) disrupt platform operations, (d) use the platform for any unlawful purpose, or (e) bypass any security measures implemented by ESCV.`
    },
    {
      icon: FaBan,
      title: '5. Prohibited Activities',
      content: `The following are strictly prohibited: (a) misrepresenting your identity or affiliation, (b) accessing data beyond your authorized role permissions, (c) reverse engineering or extracting source code, (d) automated scraping or harvesting without explicit permission, and (e) interfering with other users' platform access.`
    },
    {
      icon: FaFileContract,
      title: '6. Disclaimer & Limitation of Liability',
      content: `ESCV is provided "as is" without warranties of any kind, express or implied. While we strive for accuracy, we do not guarantee error-free or uninterrupted service. In no event shall ESCV be liable for indirect, incidental, or consequential damages arising from platform use.`
    },
    {
      icon: FaClock,
      title: '7. Service Availability',
      content: `ESCV strives to maintain 99.9% uptime but does not guarantee uninterrupted access. Scheduled maintenance will be communicated in advance. We reserve the right to modify, suspend, or discontinue any part of the service at our discretion.`
    },
    {
      icon: FaGavel,
      title: '8. Termination',
      content: `We reserve the right to suspend or terminate access at our discretion, with or without notice, for violation of these terms or for any other reason. Upon termination, your right to use the platform ceases immediately, and you must destroy any downloaded content in your possession.`
    },
    {
      icon: FaShieldAlt,
      title: '9. Governing Law',
      content: `These Terms are governed by and construed in accordance with the laws of the Arab Republic of Egypt. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Cairo, Egypt.`
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2E4A] to-[#1A3D5A] p-8 md:p-10 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <FaFileContract className="w-6 h-6 text-[#2D9B6E]" />
            <span className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Legal Document</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-[#94A3B8] max-w-2xl">
            These Terms of Service govern your use of the ESCV platform. Please read them carefully before using our services.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-[#94A3B8]">
            <span>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="hidden sm:inline">•</span>
            <span>Version 1.0</span>
            <span className="hidden sm:inline">•</span>
            <span>Cairo, Egypt</span>
          </div>
        </div>
        <div className="absolute -right-16 -bottom-16 opacity-10">
          <FaFileContract className="text-[200px] md:text-[250px]" />
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
            Questions about our Terms?
          </p>
          <a
            href="/contact"
            className="inline-block mt-2 text-[#2D9B6E] font-medium hover:underline"
          >
            Contact Support
          </a>
        </Card>
        <Card variant="elevated" className="p-6 text-center">
          <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
            Also review our Privacy Policy
          </p>
          <a
            href="/privacy"
            className="inline-block mt-2 text-[#2D9B6E] font-medium hover:underline"
          >
            Privacy Policy
          </a>
        </Card>
      </div>
    </div>
  );
};