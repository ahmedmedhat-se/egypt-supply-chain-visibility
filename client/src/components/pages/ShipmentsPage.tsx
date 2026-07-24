import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/Table';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { FaShip, FaPlus } from 'react-icons/fa';
import { useAuthStore } from '../../store/auth.store';
import { useShipments } from '../../hooks/useShipments';
import { ShipmentStatusBadge } from '../shipments/ShipmentStatusBadge';
import { CreateShipmentModal } from '../shipments/CreateShipmentModal';

export const ShipmentsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data, isLoading } = useShipments();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Shipments</h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
            {user?.organizationName ? `${user.organizationName} — ` : ''}Manage your shipments
          </p>
        </div>
        
        {/* Only allow Shippers and Admins to create new shipments for now */}
        {(user?.role === 'shipper' || user?.role === 'admin' || user?.role === 'super_admin') && (
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
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
                <Button onClick={() => setIsModalOpen(true)} variant="outline">
                  Create First Shipment
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableHead>Tracking #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {data.data.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                  <TableCell>{shipment.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#94A3B8]">From: {shipment.origin}</span>
                      <span className="text-xs text-[#94A3B8]">To: {shipment.destination}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ShipmentStatusBadge status={shipment.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateShipmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
