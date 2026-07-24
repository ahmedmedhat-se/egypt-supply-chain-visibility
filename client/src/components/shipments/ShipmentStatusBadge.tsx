import React from 'react';
import { Badge } from '../ui/Badge';
import type { ShipmentStatus } from '../../types/shipment.types';

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
}

export const ShipmentStatusBadge: React.FC<ShipmentStatusBadgeProps> = ({ status }) => {
  const getBadgeProps = (status: ShipmentStatus) => {
    switch (status) {
      case 'pending':
        return { variant: 'default' as const, label: 'Pending' };
      case 'confirmed':
        return { variant: 'info' as const, label: 'Confirmed' };
      case 'in_transit':
        return { variant: 'primary' as const, label: 'In Transit' };
      case 'at_checkpoint':
        return { variant: 'warning' as const, label: 'At Checkpoint' };
      case 'customs_hold':
        return { variant: 'danger' as const, label: 'Customs Hold' };
      case 'customs_cleared':
        return { variant: 'success' as const, label: 'Customs Cleared' };
      case 'out_for_delivery':
        return { variant: 'info' as const, label: 'Out for Delivery' };
      case 'delivered':
        return { variant: 'success' as const, label: 'Delivered' };
      case 'delayed':
        return { variant: 'warning' as const, label: 'Delayed' };
      case 'cancelled':
        return { variant: 'danger' as const, label: 'Cancelled' };
      default:
        return { variant: 'default' as const, label: status };
    }
  };

  const { variant, label } = getBadgeProps(status);

  return (
    <Badge variant={variant} dot size="sm">
      {label}
    </Badge>
  );
};
