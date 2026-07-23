import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export const Tabs = ({ tabs, activeTab, onChange, className, variant = 'default' }: TabsProps) => {
  const variants = {
    default: {
      container: 'border-b border-[#E2E8F0]',
      tab: (isActive: boolean) => cn(
        'px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
        isActive
          ? 'border-[#0A2E4A] text-[#0A2E4A]'
          : 'border-transparent text-[#94A3B8] hover:text-[#1A2A3A] hover:border-[#D1D9E6]'
      ),
    },
    pills: {
      container: 'gap-2',
      tab: (isActive: boolean) => cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
        isActive
          ? 'bg-[#0A2E4A] text-white'
          : 'text-[#94A3B8] hover:bg-[#E8F0F8] hover:text-[#1A2A3A]'
      ),
    },
    underline: {
      container: 'gap-6 border-b border-[#E2E8F0]',
      tab: (isActive: boolean) => cn(
        'px-1 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
        isActive
          ? 'border-[#2D9B6E] text-[#0A2E4A]'
          : 'border-transparent text-[#94A3B8] hover:text-[#1A2A3A]'
      ),
    },
  };

  const style = variants[variant];

  return (
    <div className={className}>
      <div className={cn('flex', style.container)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              style.tab(activeTab === tab.id),
              'flex items-center gap-2'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-[#DC2626] text-white rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};