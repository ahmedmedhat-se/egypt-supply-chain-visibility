import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCreateShipment } from '../../hooks/useShipments';
import type { CreateShipmentData } from '../../types/shipment.types';

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateShipmentModal: React.FC<CreateShipmentModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<CreateShipmentData>({
    description: '',
    origin: '',
    destination: '',
    weight: undefined,
    estimatedDelivery: '',
    notes: '',
  });

  const { mutate: createShipment, isPending } = useCreateShipment();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'weight' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShipment(formData, {
      onSuccess: () => {
        onClose();
        setFormData({
          description: '',
          origin: '',
          destination: '',
          weight: undefined,
          estimatedDelivery: '',
          notes: '',
        });
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Shipment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="e.g. Medical Supplies"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Origin City"
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            required
            placeholder="e.g. Cairo"
          />
          <Input
            label="Destination City"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            required
            placeholder="e.g. Alexandria"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Weight (kg)"
            name="weight"
            type="number"
            value={formData.weight || ''}
            onChange={handleChange}
            placeholder="0.0"
            min="0"
            step="0.1"
          />
          <Input
            label="Estimated Delivery"
            name="estimatedDelivery"
            type="datetime-local"
            value={formData.estimatedDelivery || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A2A3A] mb-1.5">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0A2E4A] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A]"
            placeholder="Any special instructions..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Create Shipment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
