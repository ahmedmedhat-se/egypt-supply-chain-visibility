import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/Modal';
import { Input } from '../../../ui/Input';
import { Select } from '../../../ui/Select';
import { Button } from '../../../ui/Button';
import { useCreateCheckpoint, useUpdateCheckpoint } from '../../../../hooks/useCheckpoints';
import type { Checkpoint } from '../../../../types/checkpoint.types';

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoint?: Checkpoint;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({ isOpen, onClose, checkpoint }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'port',
    city: '',
    latitude: '',
    longitude: '',
    address: '',
    capacity: '',
    isActive: true,
  });

  const { mutate: createCheckpoint, isPending: isCreating } = useCreateCheckpoint();
  const { mutate: updateCheckpoint, isPending: isUpdating } = useUpdateCheckpoint();

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (checkpoint) {
      setFormData({
        name: checkpoint.name,
        code: checkpoint.code,
        type: checkpoint.type,
        city: checkpoint.city,
        latitude: checkpoint.latitude.toString(),
        longitude: checkpoint.longitude.toString(),
        address: checkpoint.address || '',
        capacity: checkpoint.capacity ? checkpoint.capacity.toString() : '',
        isActive: checkpoint.isActive,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        type: 'port',
        city: '',
        latitude: '',
        longitude: '',
        address: '',
        capacity: '',
        isActive: true,
      });
    }
  }, [checkpoint, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
    };

    if (checkpoint) {
      updateCheckpoint(
        { id: checkpoint.id, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createCheckpoint(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={checkpoint ? 'Edit Checkpoint' : 'Create Checkpoint'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Alexandria Port" />
          <Input label="Code" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. ALX-PRT" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            options={[
              { value: 'port', label: 'Port' },
              { value: 'warehouse', label: 'Warehouse' },
              { value: 'border_crossing', label: 'Border Crossing' },
              { value: 'airport', label: 'Airport' },
              { value: 'facility', label: 'Facility' },
            ]}
          />
          <Input label="City" name="city" value={formData.city} onChange={handleChange} required placeholder="e.g. Alexandria" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Latitude" name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} required placeholder="e.g. 31.2001" />
          <Input label="Longitude" name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} required placeholder="e.g. 29.9187" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Capacity (optional)" name="capacity" type="number" value={formData.capacity} onChange={handleChange} placeholder="e.g. 5000" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A2A3A] mb-1.5">Address (optional)</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#0A2E4A] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="rounded border-[#E2E8F0] text-[#0A2E4A] focus:ring-[#0A2E4A]"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-[#1A2A3A]">
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {checkpoint ? 'Update Checkpoint' : 'Create Checkpoint'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
