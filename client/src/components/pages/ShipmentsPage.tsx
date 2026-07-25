import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/Table';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { FaShip, FaPlus, FaEdit } from 'react-icons/fa';
import { useAuthStore } from '../../store/auth.store';
import { useShipments } from '../../hooks/useShipments';
import { ShipmentStatusBadge } from '../shipments/ShipmentStatusBadge';
import { CreateShipmentModal } from '../shipments/CreateShipmentModal';
import { EditShipmentModal } from '../shipments/EditShipmentModal';
import type { Shipment } from '../../types/shipment.types';

export const ShipmentsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  
  const { data, isLoading } = useShipments();

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Shipments</h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
            {user?.organizationName ? `${user.organizationName} — ` : ''}Manage your shipments
          </p>
        </div>
        
        {/* Only allow Shippers and Admins to create new shipments */}
        {(user?.role === 'shipper' || user?.role === 'admin') && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <FaPlus /> New Shipment
          </Button>
        )}
      </div>

      <Card variant="default">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : !data?.data?.length ? (
          <EmptyState
            icon={FaShip}
            title="No Shipments Found"
            description="You don't have any active shipments at the moment."
            action={
              (user?.role === 'shipper' || user?.role === 'admin') ? (
                <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
                  Create First Shipment
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium">{shipment.referenceNumber}</TableCell>
                  <TableCell>{shipment.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#94A3B8]">From: {shipment.originCity}</span>
                      <span className="text-xs text-[#94A3B8]">To: {shipment.destinationCity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ShipmentStatusBadge status={shipment.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(shipment)}
                      className="flex items-center gap-1.5"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateShipmentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditShipmentModal
        isOpen={!!editingShipment}
        onClose={() => setEditingShipment(null)}
        shipment={editingShipment}
      />
    </div>
  );
};
