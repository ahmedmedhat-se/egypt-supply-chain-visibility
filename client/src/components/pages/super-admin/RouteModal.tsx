import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/Modal';
import { Input } from '../../../ui/Input';
import { Button } from '../../../ui/Button';
import { useCreateRoute, useUpdateRoute } from '../../../../hooks/useRoutes';
import type { Route } from '../../../../types/route.types';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route?: Route;
}

export const RouteModal: React.FC<RouteModalProps> = ({ isOpen, onClose, route }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    originCity: '',
    destinationCity: '',
    estimatedDays: '',
    isActive: true,
  });

  const { mutate: createRoute, isPending: isCreating } = useCreateRoute();
  const { mutate: updateRoute, isPending: isUpdating } = useUpdateRoute();

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        code: route.code,
        originCity: route.originCity,
        destinationCity: route.destinationCity,
        estimatedDays: route.estimatedDays ? route.estimatedDays.toString() : '',
        isActive: route.isActive,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        originCity: '',
        destinationCity: '',
        estimatedDays: '',
        isActive: true,
      });
    }
  }, [route, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      estimatedDays: parseInt(formData.estimatedDays, 10),
    };

    if (route) {
      updateRoute(
        { id: route.id, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createRoute(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={route ? 'Edit Route' : 'Create Route'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Cairo to Alexandria Express" />
          <Input label="Code" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. CAI-ALX-01" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Origin City" name="originCity" value={formData.originCity} onChange={handleChange} required placeholder="e.g. Cairo" />
          <Input label="Destination City" name="destinationCity" value={formData.destinationCity} onChange={handleChange} required placeholder="e.g. Alexandria" />
        </div>

        <div>
          <Input label="Estimated Transit Time (Days)" name="estimatedDays" type="number" min="1" value={formData.estimatedDays} onChange={handleChange} required placeholder="e.g. 2" />
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
            {route ? 'Update Route' : 'Create Route'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
