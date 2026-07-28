import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { MapPicker } from '../../ui/MapPicker';
import { useCreateCheckpoint, useUpdateCheckpoint } from '../../../hooks/useCheckpoints';
import type { Checkpoint, CheckpointType, CreateCheckpointData } from '../../../types/checkpoint.types';

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
        latitude: checkpoint.latitude ? checkpoint.latitude.toString() : '',
        longitude: checkpoint.longitude ? checkpoint.longitude.toString() : '',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        type: 'port',
        city: '',
        latitude: '',
        longitude: '',
      });
    }
  }, [checkpoint, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateCheckpointData = {
      name: formData.name,
      code: formData.code,
      type: formData.type as CheckpointType,
      city: formData.city,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
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
    <Modal isOpen={isOpen} onClose={onClose} title={checkpoint ? 'Edit Checkpoint' : 'Create Checkpoint'} size="lg">
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
              { value: 'customs', label: 'Customs' },
              { value: 'hub', label: 'Hub' },
              { value: 'border', label: 'Border' },
              { value: 'depot', label: 'Depot' },
            ]}
          />
          <Input label="City" name="city" value={formData.city} onChange={handleChange} required placeholder="e.g. Alexandria" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#1A2A3A] dark:text-white mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <MapPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLatitudeChange={(v) => setFormData((prev) => ({ ...prev, latitude: v }))}
            onLongitudeChange={(v) => setFormData((prev) => ({ ...prev, longitude: v }))}
          />
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
