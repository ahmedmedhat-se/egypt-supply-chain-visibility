import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shipmentsApi } from '../../api/shipments.api';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { ShipmentDetailModal } from '../shipments/ShipmentDetailModal';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import type { Shipment } from '../../types/shipment.types';

export const ShipmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No shipment ID provided');
      setLoading(false);
      return;
    }

    shipmentsApi
      .getById(id)
      .then((res) => {
        setShipment(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load shipment');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#0A2E4A] dark:hover:text-white transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <FaExclamationTriangle className="w-12 h-12 text-[#DC2626] mb-4" />
          <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">
            Shipment Not Found
          </h2>
          <p className="text-[#94A3B8] mb-6">{error || 'The shipment could not be loaded.'}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <FaArrowLeft className="mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#0A2E4A] dark:hover:text-white transition-colors"
      >
        <FaArrowLeft className="w-4 h-4" />
        Back to Shipments
      </button>

      <ShipmentDetailModal
        isOpen={true}
        onClose={() => navigate(-1)}
        shipment={shipment}
      />
    </div>
  );
};
