import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { showToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import apiClient from '../../api/client';

const contactSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  subject: z.string()
    .min(1, 'Subject is required')
    .min(3, 'Subject must be at least 3 characters')
    .max(100, 'Subject is too long'),
  message: z.string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message is too long'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      subject: '',
      message: '',
    },
  });
  const getMessageValue = () => getValues('message');

  const contactInfo = [
    {
      icon: FaEnvelope,
      title: 'Email',
      details: 'support@escv.com',
      description: 'We\'ll respond within 24 hours',
      href: 'mailto:support@escv.com',
    },
    {
      icon: FaPhone,
      title: 'Phone',
      details: '+20 123 456 7890',
      description: 'Available 9:00 AM - 6:00 PM',
      href: 'tel:+201234567890',
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Location',
      details: 'Cairo, Egypt',
      description: 'Smart Village, Giza',
      href: '#',
    },
    {
      icon: FaClock,
      title: 'Working Hours',
      details: 'Sunday - Thursday',
      description: '9:00 AM - 6:00 PM',
      href: '#',
    },
  ];

  const handleFocus = (field: string) => {
    setFocusedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setFocusedFields(prev => ({ ...prev, [field]: false }));
  };

  const getFieldRing = (field: keyof ContactFormData) => {
    if (errors[field]) {
      return 'ring-2 ring-[#DC2626] ring-offset-2 dark:ring-offset-[#0A2E4A]';
    }
    if (focusedFields[field]) {
      return 'ring-2 ring-[#2D9B6E] ring-offset-2 dark:ring-offset-[#0A2E4A]';
    }
    return '';
  };

  const getFieldBorder = (field: keyof ContactFormData) => {
    if (errors[field]) {
      return 'border-[#DC2626] dark:border-[#DC2626]';
    }
    return 'border-[#D1D9E6] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E]';
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/contact', data);
      setIsSuccess(true);
      showToast.success('Message sent successfully! We\'ll get back to you soon.');
      reset();
      setTimeout(() => setIsSuccess(false), 5000);
    } catch {
      showToast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2E4A] to-[#1A3D5A] p-8 md:p-12 text-white">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-[#94A3B8] dark:text-[#94A3B8]">
            Have questions? We'd love to hear from you. Get in touch with our team.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10">
          <FaEnvelope className="text-[200px] md:text-[300px]" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-4">
          {contactInfo.map((info) => (
            <Card key={info.title} variant="elevated" className="group hover:shadow-xl transition-shadow duration-300">
              <a
                href={info.href}
                className="flex items-start gap-4 no-underline"
                target={info.href.startsWith('http') ? '_blank' : undefined}
                rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <div className="w-10 h-10 rounded-lg bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <info.icon className="w-5 h-5 text-[#2D9B6E]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white group-hover:text-[#2D9B6E] dark:group-hover:text-[#2D9B6E] transition-colors">
                    {info.title}
                  </h3>
                  <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">{info.details}</p>
                  <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8]">{info.description}</p>
                </div>
              </a>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card variant="elevated" className="relative">
            {isSuccess && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#0A2E4A]/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 animate-in fade-in zoom-in duration-300">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="w-8 h-8 text-[#2D9B6E]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-2">Message Sent!</h3>
                  <p className="text-[#94A3B8] dark:text-[#94A3B8]">We'll get back to you within 24 hours.</p>
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
                    First Name
                    <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('firstName'))}>
                    <input
                      type="text"
                      placeholder="Ahmed"
                      disabled={isSubmitting}
                      className={cn(
                        'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
                        'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
                        'focus:outline-none transition-all duration-200',
                        getFieldBorder('firstName'),
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      {...register('firstName')}
                      onFocus={() => handleFocus('firstName')}
                      onBlur={() => handleBlur('firstName')}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
                      <span className="text-xs">⚠</span>
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
                    Last Name
                    <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('lastName'))}>
                    <input
                      type="text"
                      placeholder="Medhat"
                      disabled={isSubmitting}
                      className={cn(
                        'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
                        'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
                        'focus:outline-none transition-all duration-200',
                        getFieldBorder('lastName'),
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      {...register('lastName')}
                      onFocus={() => handleFocus('lastName')}
                      onBlur={() => handleBlur('lastName')}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
                      <span className="text-xs">⚠</span>
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
                  Email Address
                  <span className="text-[#DC2626]">*</span>
                </label>
                <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('email'))}>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
                      'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
                      'focus:outline-none transition-all duration-200',
                      getFieldBorder('email'),
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    {...register('email')}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
                    <span className="text-xs">⚠</span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
                  Subject
                  <span className="text-[#DC2626]">*</span>
                </label>
                <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('subject'))}>
                  <input
                    type="text"
                    placeholder="What's this about?"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
                      'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
                      'focus:outline-none transition-all duration-200',
                      getFieldBorder('subject'),
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    {...register('subject')}
                    onFocus={() => handleFocus('subject')}
                    onBlur={() => handleBlur('subject')}
                  />
                </div>
                {errors.subject && (
                  <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
                    <span className="text-xs">⚠</span>
                    {errors.subject.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
                  Message
                  <span className="text-[#DC2626]">*</span>
                </label>
                <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('message'))}>
                  <textarea
                    placeholder="Tell us how we can help..."
                    rows={5}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A] resize-y min-h-[120px]',
                      'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
                      'focus:outline-none transition-all duration-200',
                      getFieldBorder('message'),
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    {...register('message')}
                    onFocus={() => handleFocus('message')}
                    onBlur={() => handleBlur('message')}
                  />
                </div>
                {errors.message && (
                  <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
                    <span className="text-xs">⚠</span>
                    {errors.message.message}
                  </p>
                )}
                <div className="flex justify-end">
                  <span className="text-xs text-[#94A3B8] dark:text-[#64748B]">
                    {getMessageValue()?.length || 0}/500
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="bg-[#2D9B6E] hover:bg-[#1F7A52] dark:bg-[#2D9B6E] dark:hover:bg-[#1F7A52] text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-[#2D9B6E]/20 dark:shadow-[#2D9B6E]/10 hover:shadow-xl hover:shadow-[#2D9B6E]/30 dark:hover:shadow-[#2D9B6E]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin w-4 h-4" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <span>Send Message</span>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};