import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useUpdateShipment } from '../../hooks/useShipments';
import { cn } from '../../lib/utils';
import { FaChevronDown } from 'react-icons/fa';
import type { Shipment, UpdateShipmentData } from '../../types/shipment.types';

interface EditShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
}

export const EditShipmentModal: React.FC<EditShipmentModalProps> = ({ isOpen, onClose, shipment }) => {
  const [formData, setFormData] = useState<UpdateShipmentData>({
    description: '',
    originAddress: '',
    destinationAddress: '',
    originCity: '',
    destinationCity: '',
    weightKg: undefined,
    volumeM3: undefined,
    cargoType: '',
    estimatedArrivalAt: undefined,
    estimatedDepartureAt: undefined,
    notes: '',
  });
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const { mutate: updateShipment, isPending } = useUpdateShipment();

  // Populate form when shipment data changes
  useEffect(() => {
    if (shipment) {
      setFormData({
        description: shipment.description || '',
        originAddress: shipment.originAddress || '',
        destinationAddress: shipment.destinationAddress || '',
        originCity: shipment.originCity || '',
        destinationCity: shipment.destinationCity || '',
        weightKg: shipment.weightKg ?? undefined,
        volumeM3: shipment.volumeM3 ?? undefined,
        cargoType: shipment.cargoType || '',
        estimatedArrivalAt: shipment.estimatedArrivalAt
          ? shipment.estimatedArrivalAt.slice(0, 16)
          : undefined,
        estimatedDepartureAt: shipment.estimatedDepartureAt
          ? shipment.estimatedDepartureAt.slice(0, 16)
          : undefined,
        notes: shipment.notes || '',
      });
      setShowMoreOptions(false);
    }
  }, [shipment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'weightKg' || name === 'volumeM3'
          ? (value ? Number(value) : undefined)
          : name === 'estimatedArrivalAt' || name === 'estimatedDepartureAt'
            ? (value || undefined)
            : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) return;
    updateShipment(
      { id: shipment.id, data: formData },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    onClose();
    setShowMoreOptions(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Shipment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="e.g. Medical Supplies"
        />

        <fieldset className="border border-[#E2E8F0] dark:border-[#1A3D5A] rounded-lg p-4 space-y-3">
          <legend className="text-sm font-semibold text-[#0A2E4A] dark:text-white px-2">Origin</legend>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Address"
              name="originAddress"
              value={formData.originAddress || ''}
              onChange={handleChange}
              placeholder="e.g. 123 Main St"
            />
            <Input
              label="City"
              name="originCity"
              value={formData.originCity || ''}
              onChange={handleChange}
              placeholder="e.g. Cairo"
            />
          </div>
        </fieldset>

        <fieldset className="border border-[#E2E8F0] dark:border-[#1A3D5A] rounded-lg p-4 space-y-3">
          <legend className="text-sm font-semibold text-[#0A2E4A] dark:text-white px-2">Destination</legend>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Address"
              name="destinationAddress"
              value={formData.destinationAddress || ''}
              onChange={handleChange}
              placeholder="e.g. 456 Nile St"
            />
            <Input
              label="City"
              name="destinationCity"
              value={formData.destinationCity || ''}
              onChange={handleChange}
              placeholder="e.g. Alexandria"
            />
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Weight (kg)"
            name="weightKg"
            type="number"
            value={formData.weightKg ?? ''}
            onChange={handleChange}
            placeholder="0.0"
            min="0"
            step="0.1"
          />
          <Input
            label="Estimated Arrival"
            name="estimatedArrivalAt"
            type="datetime-local"
            value={formData.estimatedArrivalAt || ''}
            onChange={handleChange}
          />
        </div>

        {/* More Options Toggle */}
        <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A] pt-2">
          <button
            type="button"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="flex items-center gap-2 text-sm font-medium text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-all duration-200 group"
          >
            <FaChevronDown
              className={cn(
                'w-3 h-3 transition-transform duration-200',
                showMoreOptions && 'rotate-180',
              )}
            />
            <span>More Options</span>
            <span className="text-[11px] text-[#94A3B8]/60 dark:text-[#94A3B8]/40 font-normal">(optional)</span>
          </button>

          {/* Expandable Options */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              showMoreOptions ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0',
            )}
          >
            <div className="grid grid-cols-2 gap-4 pb-2">
              <Input
                label="Cargo Type"
                name="cargoType"
                value={formData.cargoType || ''}
                onChange={handleChange}
                placeholder="e.g. Electronics, Food"
              />
              <Input
                label="Volume (m³)"
                name="volumeM3"
                type="number"
                value={formData.volumeM3 ?? ''}
                onChange={handleChange}
                placeholder="0.0"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] mb-1.5">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-[#E2E8F0] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] px-3 py-2 text-sm text-[#1A2A3A] dark:text-white focus:border-[#0A2E4A] dark:focus:border-[#2D9B6E] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E] placeholder:text-[#94A3B8] dark:placeholder:text-[#94A3B8]"
            placeholder="Any special instructions..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
          <Button variant="outline" type="button" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
