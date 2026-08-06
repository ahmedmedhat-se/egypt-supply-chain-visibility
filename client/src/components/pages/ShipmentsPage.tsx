import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/Table';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { Pagination } from '../ui/Pagination';
import { FaShip, FaPlus, FaEdit, FaHandPaper, FaCheckCircle, FaTruck, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAuthStore } from '../../store/auth.store';
import { useShipments, useAcceptShipment, useUpdateShipmentStatus } from '../../hooks/useShipments';
import { ShipmentStatusBadge } from '../shipments/ShipmentStatusBadge';
import { CreateShipmentModal } from '../shipments/CreateShipmentModal';
import { EditShipmentModal } from '../shipments/EditShipmentModal';
import { ShipmentDetailModal } from '../shipments/ShipmentDetailModal';
import { STATUS_TRANSITIONS as STATUS_TRANSITIONS_MAP } from '../../constants/shipments';
import type { Shipment, ShipmentStatus } from '../../types/shipment.types';

export const ShipmentsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [detailShipment, setDetailShipment] = useState<Shipment | null>(null);
  const [statusOpenId, setStatusOpenId] = useState<string | null>(null);
  const [statusDropdownPos, setStatusDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useShipments({ page, limit });
  const { mutate: acceptShipment, isPending: isAccepting } = useAcceptShipment();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateShipmentStatus();

  const isCarrier = user?.role === 'carrier';
  const isShipper = user?.role === 'shipper';
  const isAdmin = user?.role === 'admin';

  // A carrier-org admin must NOT see create/edit shipment
  const canCreate = isShipper || (isAdmin && user?.organizationType === 'shipper');
  const canEdit = isShipper || (isAdmin && user?.organizationType === 'shipper');

  const canUpdateStatus = (shipment?: Shipment) => {
    // Anyone can update status normally
    if (isCarrier || isShipper) return true;

    // For cancelled shipments, only super_admin or the shipper org's admin can restore
    if (shipment?.status === 'cancelled') {
      const isSuperAdmin = user?.role === 'super_admin';
      const isShipmentOrgAdmin = isAdmin && shipment.shipperOrganization?.organization_id === user?.organizationId;
      return isSuperAdmin || isShipmentOrgAdmin;
    }

    return isAdmin || user?.role === 'super_admin';
  };

  const getValidTransitions = (status: string, shipment?: Shipment): ShipmentStatus[] => {
    const transitions = (STATUS_TRANSITIONS_MAP[status] as ShipmentStatus[]) || [];
    // Only super_admin and shipment org admin can restore cancelled shipments
    if (status === 'cancelled' && shipment) {
      const isSuperAdmin = user?.role === 'super_admin';
      const isShipmentOrgAdmin = isAdmin && shipment.shipperOrganization?.organization_id === user?.organizationId;
      if (!isSuperAdmin && !isShipmentOrgAdmin) {
        return [];
      }
    }
    return transitions;
  };

  // Check if a shipment can be claimed by the current carrier
  const canClaim = (shipment: Shipment) =>
    isCarrier &&
    !shipment.carrierOrganization;

  // Check if the shipment is assigned to the current carrier's org
  const isMyCarrierShipment = (shipment: Shipment) =>
    isCarrier &&
    shipment.carrierOrganization &&
    shipment.carrierOrganization.organization_id === user?.organizationId;

  const handleAccept = (shipment: Shipment) => {
    if (window.confirm(`Accept shipment "${shipment.referenceNumber}"? Your organization will be assigned as the carrier.`)) {
      acceptShipment(shipment.id);
    }
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
  };

  const handleStatusToggle = (shipmentId: string) => {
    if (statusOpenId === shipmentId) {
      setStatusOpenId(null);
      setStatusDropdownPos(null);
      return;
    }
    const btn = buttonRefs.current[shipmentId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setStatusDropdownPos({ top: rect.bottom + 4, left: rect.right - 192 });
    }
    setStatusOpenId(shipmentId);
  };

  // Close dropdown on scroll to prevent stale positioning
  useEffect(() => {
    if (!statusOpenId) return;
    const handleScroll = () => {
      setStatusOpenId(null);
      setStatusDropdownPos(null);
    };
    window.addEventListener('scroll', handleScroll, { once: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [statusOpenId]);

  const handleStatusChange = (shipment: Shipment, newStatus: ShipmentStatus) => {
    updateStatus({ id: shipment.id, data: { status: newStatus } });
    setStatusOpenId(null);
  };

  const handleViewDetail = (shipment: Shipment) => {
    setDetailShipment(shipment);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Shipments</h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
            {user?.organizationName ? `${user.organizationName} — ` : ''}
            {isCarrier ? 'Available & assigned shipments' : 'Manage your shipments'}
          </p>
        </div>

        {canCreate && (
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
              canCreate ? (
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
                <TableHead>Carrier</TableHead>
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
                    {shipment.carrierOrganization ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <FaTruck className="w-3.5 h-3.5 text-[#1E40AF]" />
                        <span className="text-[#1A2A3A] dark:text-[#E2E8F0]">
                          {shipment.carrierOrganization.organization_name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm text-[#94A3B8]">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ShipmentStatusBadge status={shipment.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Detail */}
                      <button
                        onClick={() => handleViewDetail(shipment)}
                        className="p-1.5 rounded-lg text-[#1E40AF] hover:bg-[#DBEAFE] transition-colors"
                        title="View Details"
                      >
                        <FaEye className="w-3.5 h-3.5" />
                      </button>

                      {/* Accept for carriers */}
                      {canClaim(shipment) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAccept(shipment)}
                          disabled={isAccepting}
                          className="flex items-center gap-1.5 text-[#065F46] border-[#065F46] hover:bg-[#D1FAE5]"
                        >
                          <FaHandPaper className="w-3.5 h-3.5" />
                          Accept
                        </Button>
                      )}

                      {/* Assigned badge for carriers */}
                      {isMyCarrierShipment(shipment) && (
                        <span className="inline-flex items-center gap-1 text-xs text-[#065F46] bg-[#D1FAE5] px-2 py-1 rounded-full">
                          <FaCheckCircle className="w-3 h-3" />
                          Assigned
                        </span>
                      )}

                      {/* Status Dropdown */}
                      {canUpdateStatus(shipment) && getValidTransitions(shipment.status, shipment).length > 0 && (
                        <div className="relative">
                          <button
                            ref={(el) => { buttonRefs.current[shipment.id] = el; }}
                            onClick={() => handleStatusToggle(shipment.id)}
                            className="p-1.5 rounded-lg text-[#2D9B6E] hover:bg-[#D1FAE5] transition-colors"
                            title="Update Status"
                            disabled={isUpdatingStatus}
                          >
                            {statusOpenId === shipment.id ? <FaChevronUp className="w-3.5 h-3.5" /> : <FaChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {statusOpenId === shipment.id && statusDropdownPos && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => { setStatusOpenId(null); setStatusDropdownPos(null); }} />
                              <div
                                style={{ top: statusDropdownPos.top, left: statusDropdownPos.left }}
                                className="fixed z-50 w-48 bg-white dark:bg-[#1A3D5A] rounded-lg shadow-xl border border-[#E2E8F0] dark:border-[#1A3D5A] py-1"
                              >
                                <div className="px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0] dark:border-[#1A3D5A]">
                                  Change to:
                                </div>
                                {getValidTransitions(shipment.status, shipment).map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => handleStatusChange(shipment, s)}
                                    className="w-full text-left px-3 py-2 text-sm text-[#1A2A3A] dark:text-[#E2E8F0] hover:bg-[#E8F0F8] dark:hover:bg-[#0A2E4A] transition-colors capitalize"
                                  >
                                    {s.replace(/_/g, ' ')}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Edit for shippers/admins */}
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(shipment)}
                          className="flex items-center gap-1.5"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {data && !isLoading && (
        <Pagination
          page={page}
          totalPages={data.meta.totalPages}
          totalItems={data.meta.totalItems}
          limit={limit}
          onPageChange={setPage}
          className="px-1"
        />
      )}

      <CreateShipmentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditShipmentModal
        isOpen={!!editingShipment}
        onClose={() => setEditingShipment(null)}
        shipment={editingShipment}
      />
      <ShipmentDetailModal
        isOpen={!!detailShipment}
        onClose={() => setDetailShipment(null)}
        shipment={detailShipment}
      />
    </div>
  );
};
