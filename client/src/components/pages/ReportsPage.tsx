import { Card } from '../ui/Card';
import { FaFileAlt } from 'react-icons/fa';

export const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Reports</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">Generate and view reports</p>
      </div>
      <Card variant="bordered" className="p-12 text-center">
        <FaFileAlt className="w-16 h-16 mx-auto mb-4 text-[#94A3B8]" />
        <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">Reports & Analytics</h2>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] max-w-md mx-auto">
          Generate custom reports, export shipment data, and view analytics for your supply chain operations.
        </p>
      </Card>
    </div>
  );
};
