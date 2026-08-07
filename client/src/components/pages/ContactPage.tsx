import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaSpinner, FaCheckCircle, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { showToast } from '../ui/Toast';
import { cn } from '../../lib/utils';

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
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const contactInfo = [
    {
      icon: FaEnvelope,
      title: 'Email',
      details: 'support@escv.com',
      description: 'We\'ll respond within 24 hours',
      href: 'mailto:support@escv.com',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      icon: FaPhone,
      title: 'Phone',
      details: '+20 123 456 7890',
      description: 'Available 9:00 AM - 6:00 PM',
      href: 'tel:+201234567890',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Location',
      details: 'Cairo, Egypt',
      description: 'Smart Village, Giza',
      href: '#',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      icon: FaClock,
      title: 'Working Hours',
      details: 'Sunday - Thursday',
      description: '9:00 AM - 6:00 PM',
      href: '#',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    },
  ];

  /**
   * Sets focus state for a field when it receives focus
   */
  const handleFocus = (field: string) => {
    setFocusedFields(prev => ({ ...prev, [field]: true }));
  };

  /**
   * Handles blur events: removes focus state, marks field as touched, triggers validation
   */
  const handleBlur = (field: keyof ContactFormData) => {
    setFocusedFields(prev => ({ ...prev, [field]: false }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    trigger(field);
  };

  /**
   * Determines the visual state of a field based on focus, touch, errors, and value
   * Returns: 'default' | 'focused' | 'error' | 'success'
   */
  const getFieldState = (field: keyof ContactFormData) => {
    const hasError = errors[field];
    const isTouched = touchedFields[field];
    const isFocused = focusedFields[field];
    const fieldValue = getValues(field);
    const hasValue = fieldValue !== undefined && fieldValue !== '';

    if (hasError && isTouched) return 'error';
    if (isFocused) return 'focused';
    if (isTouched && !hasError && hasValue) return 'success';
    return 'default';
  };

  /**
   * Generates dynamic Tailwind CSS classes for a field based on its current state
   */
  const getFieldStyles = (field: keyof ContactFormData) => {
    const state = getFieldState(field);
    const baseStyles = 'w-full px-4 py-3.5 rounded-xl border-2 bg-white dark:bg-[#0F2A44] text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] focus:outline-none transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';

    const stateStyles = {
      default: 'border-[#E2E8F0] dark:border-[#1A3D5A] hover:border-[#94A3B8] dark:hover:border-[#64748B]',
      focused: 'border-[#2D9B6E] shadow-[0_0_0_4px_rgba(45,155,110,0.15)] dark:shadow-[0_0_0_4px_rgba(45,155,110,0.25)]',
      error: 'border-[#DC2626] shadow-[0_0_0_4px_rgba(220,38,38,0.15)] dark:shadow-[0_0_0_4px_rgba(220,38,38,0.25)] bg-[#FEF2F2] dark:bg-[#2A0F0F]',
      success: 'border-[#2D9B6E] bg-[#F0FDF4] dark:bg-[#0F2A1F]',
    };

    return cn(baseStyles, stateStyles[state]);
  };

  /**
   * Renders validation icon (checkmark or exclamation) based on field state
   */
  const renderFieldIcon = (field: keyof ContactFormData) => {
    const state = getFieldState(field);
    if (state === 'error' && touchedFields[field]) {
      return <FaExclamationCircle className="w-4 h-4 text-[#DC2626]" />;
    }
    if (state === 'success' && touchedFields[field]) {
      return <FaCheck className="w-4 h-4 text-[#2D9B6E]" />;
    }
    return null;
  };

  const isDirty = Object.keys(touchedFields).length > 0;

  const onSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSuccess(true);
    showToast.success('Message sent successfully! We\'ll get back to you soon.');
    reset();
    setTouchedFields({});
    setTimeout(() => setIsSuccess(false), 5000);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2E4A] via-[#1A3D5A] to-[#2D5A7A] p-8 sm:p-10 lg:p-14 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-12 bg-[#2D9B6E] rounded-full" />
            <span className="text-sm font-semibold text-[#2D9B6E] uppercase tracking-wider">Get in Touch</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Let's Start a <span className="text-[#2D9B6E]">Conversation</span>
          </h1>
          <p className="text-base sm:text-lg text-[#94A3B8] dark:text-[#94A3B8] leading-relaxed max-w-xl">
            Have questions or need assistance? We're here to help. Reach out to our team and we'll get back to you promptly.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-[#2D9B6E] rounded-full animate-pulse" />
              <span className="text-sm text-[#E2E8F0]">Average response time: 24 hours</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-5">
          <FaEnvelope className="text-[200px] sm:text-[300px] lg:text-[400px]" />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2D9B6E]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Contact Info Cards */}
        <div className="lg:col-span-1 space-y-4">
          {contactInfo.map((info, index) => (
            <a
              key={info.title}
              href={info.href}
              target={info.href.startsWith('http') ? '_blank' : undefined}
              rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group block p-5 rounded-2xl bg-white dark:bg-[#0F2A44] border-2 border-[#E2E8F0] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] transition-all duration-300 hover:shadow-xl hover:shadow-[#2D9B6E]/10 dark:hover:shadow-[#2D9B6E]/5 hover:-translate-y-1 no-underline animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110',
                  info.bgColor
                )}>
                  <info.icon className={cn('w-5 h-5', info.title === 'Email' ? 'text-blue-500' : 
                    info.title === 'Phone' ? 'text-green-500' :
                    info.title === 'Location' ? 'text-purple-500' : 'text-orange-500'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-[#E2E8F0] group-hover:text-[#2D9B6E] dark:group-hover:text-[#2D9B6E] transition-colors">
                    {info.title}
                  </h3>
                  <p className="text-sm font-medium text-[#1A2A3A] dark:text-white truncate">{info.details}</p>
                  <p className="text-xs text-[#94A3B8] dark:text-[#64748B]">{info.description}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#2D9B6E]/10 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-3 h-3 text-[#2D9B6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 relative">
          <div className="bg-white dark:bg-[#0F2A44] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#1A3D5A] p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Success Overlay */}
            {isSuccess && (
              <div className="absolute inset-0 bg-white/95 dark:bg-[#0F2A44]/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20 animate-in fade-in zoom-in duration-500">
                <div className="text-center p-8 max-w-sm">
                  <div className="w-20 h-20 rounded-full bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <FaCheckCircle className="w-10 h-10 text-[#2D9B6E]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A2E4A] dark:text-white mb-2">Message Sent! 🎉</h3>
                  <p className="text-[#94A3B8] dark:text-[#94A3B8] text-sm leading-relaxed">
                    Thank you for reaching out. Our team will respond within 24 hours.
                  </p>
                </div>
              </div>
            )}

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#2D9B6E]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Send a Message</h2>
                  <p className="text-sm text-[#94A3B8] dark:text-[#64748B] mt-1">We'll get back to you within 24 hours</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#2D9B6E]/10 rounded-full">
                  <div className="w-1.5 h-1.5 bg-[#2D9B6E] rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-[#2D9B6E]">Online</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
                      First Name
                      <span className="text-[#DC2626] text-base">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="John"
                        disabled={isSubmitting}
                        className={cn(getFieldStyles('firstName'), 'pr-10')}
                        {...register('firstName')}
                        onFocus={() => handleFocus('firstName')}
                        onBlur={() => handleBlur('firstName')}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {renderFieldIcon('firstName')}
                      </div>
                    </div>
                    {errors.firstName && touchedFields.firstName && (
                      <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                        <span className="text-xs">⚠</span>
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
                      Last Name
                      <span className="text-[#DC2626] text-base">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Doe"
                        disabled={isSubmitting}
                        className={cn(getFieldStyles('lastName'), 'pr-10')}
                        {...register('lastName')}
                        onFocus={() => handleFocus('lastName')}
                        onBlur={() => handleBlur('lastName')}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {renderFieldIcon('lastName')}
                      </div>
                    </div>
                    {errors.lastName && touchedFields.lastName && (
                      <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                        <span className="text-xs">⚠</span>
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
                    Email Address
                    <span className="text-[#DC2626] text-base">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="you@company.com"
                      disabled={isSubmitting}
                      className={cn(getFieldStyles('email'), 'pr-10')}
                      {...register('email')}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {renderFieldIcon('email')}
                    </div>
                  </div>
                  {errors.email && touchedFields.email && (
                    <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                      <span className="text-xs">⚠</span>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
                    Subject
                    <span className="text-[#DC2626] text-base">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="What's this about?"
                      disabled={isSubmitting}
                      className={cn(getFieldStyles('subject'), 'pr-10')}
                      {...register('subject')}
                      onFocus={() => handleFocus('subject')}
                      onBlur={() => handleBlur('subject')}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {renderFieldIcon('subject')}
                    </div>
                  </div>
                  {errors.subject && touchedFields.subject && (
                    <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                      <span className="text-xs">⚠</span>
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
                    Message
                    <span className="text-[#DC2626] text-base">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder="Tell us how we can help..."
                      rows={5}
                      disabled={isSubmitting}
                      className={cn(
                        getFieldStyles('message'),
                        'resize-y min-h-[120px] pr-10'
                      )}
                      {...register('message')}
                      onFocus={() => handleFocus('message')}
                      onBlur={() => handleBlur('message')}
                    />
                    <div className="absolute right-3 top-3">
                      {renderFieldIcon('message')}
                    </div>
                  </div>
                  {errors.message && touchedFields.message && (
                    <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                      <span className="text-xs">⚠</span>
                      {errors.message.message}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#94A3B8] dark:text-[#64748B]">
                      Minimum 10 characters
                    </span>
                    <span className={cn(
                      'text-xs font-medium transition-colors duration-200',
                      (getValues('message')?.length || 0) > 450 ? 'text-yellow-600 dark:text-yellow-400' : 'text-[#94A3B8] dark:text-[#64748B]'
                    )}>
                      {(getValues('message')?.length || 0)}/500
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="w-full relative overflow-hidden group bg-gradient-to-r from-[#2D9B6E] to-[#1F7A52] hover:from-[#1F7A52] hover:to-[#166B44] text-white font-semibold py-4 rounded-xl shadow-lg shadow-[#2D9B6E]/30 dark:shadow-[#2D9B6E]/20 hover:shadow-xl hover:shadow-[#2D9B6E]/40 dark:hover:shadow-[#2D9B6E]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-[#2D9B6E]/30"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin w-5 h-5" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <svg 
                          className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};