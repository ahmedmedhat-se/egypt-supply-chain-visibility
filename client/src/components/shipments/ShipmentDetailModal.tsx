import React from 'react';
import { Modal } from '../ui/Modal';
import { ShipmentStatusBadge } from './ShipmentStatusBadge';
import { FaTruck, FaBuilding, FaMapMarkerAlt, FaWeight, FaCube, FaCalendarAlt, FaStickyNote } from 'react-icons/fa';
import type { Shipment } from '../../types/shipment.types';

interface ShipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
}

export const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({ isOpen, onClose, shipment }) => {
  if (!shipment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Shipment ${shipment.referenceNumber}`} size="lg">
      <div className="space-y-6">
        {/* Status & Description */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#0A2E4A] dark:text-white">
              {shipment.description || 'No description'}
            </h3>
            <p className="text-sm text-[#94A3B8] mt-0.5">
              Created {new Date(shipment.createdAt).toLocaleString()}
            </p>
          </div>
          <ShipmentStatusBadge status={shipment.status} />
        </div>

        {/* Divider */}
        <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A]" />

        {/* Route Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FaMapMarkerAlt className="w-4 h-4 text-[#2D9B6E]" />
              Origin
            </h4>
            <p className="text-sm text-[#1A2A3A] dark:text-[#E2E8F0]">{shipment.originAddress}</p>
            <p className="text-sm text-[#94A3B8]">{shipment.originCity}</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FaMapMarkerAlt className="w-4 h-4 text-[#DC2626]" />
              Destination
            </h4>
            <p className="text-sm text-[#1A2A3A] dark:text-[#E2E8F0]">{shipment.destinationAddress}</p>
            <p className="text-sm text-[#94A3B8]">{shipment.destinationCity}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A]" />

        {/* Cargo Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1A3D5A]/50">
            <FaWeight className="w-5 h-5 text-[#94A3B8]" />
            <div>
              <p className="text-xs text-[#94A3B8]">Weight</p>
              <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
                {shipment.weightKg ? `${shipment.weightKg} kg` : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1A3D5A]/50">
            <FaCube className="w-5 h-5 text-[#94A3B8]" />
            <div>
              <p className="text-xs text-[#94A3B8]">Volume</p>
              <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
                {shipment.volumeM3 ? `${shipment.volumeM3} m³` : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1A3D5A]/50">
            <FaBuilding className="w-5 h-5 text-[#94A3B8]" />
            <div>
              <p className="text-xs text-[#94A3B8]">Cargo Type</p>
              <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
                {shipment.cargoType || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Organizations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1A3D5A]">
            <FaBuilding className="w-5 h-5 text-[#2D9B6E]" />
            <div>
              <p className="text-xs text-[#94A3B8]">Shipper</p>
              <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
                {shipment.shipperOrganization?.organization_name || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1A3D5A]">
            <FaTruck className="w-5 h-5 text-[#1E40AF]" />
            <div>
              <p className="text-xs text-[#94A3B8]">Carrier</p>
              <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
                {shipment.carrierOrganization?.organization_name || 'Unassigned'}
              </p>
            </div>
          </div>
        </div>

        {/* Route & Checkpoint */}
        {shipment.route && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1A3D5A]">
            <FaMapMarkerAlt className="w-5 h-5 text-[#92400E]" />
            <div>
              <p className="text-xs text-[#94A3B8]">Route</p>
              <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">
                {shipment.route.route_name} ({shipment.route.route_code})
              </p>
              {shipment.currentCheckpoint && (
                <p className="text-xs text-[#2D9B6E] mt-0.5">
                  Current: {shipment.currentCheckpoint.checkpoint_name} — {shipment.currentCheckpoint.checkpoint_city}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shipment.estimatedDepartureAt && (
            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <FaCalendarAlt className="w-4 h-4" />
              <span>Est. Departure: {new Date(shipment.estimatedDepartureAt).toLocaleString()}</span>
            </div>
          )}
          {shipment.estimatedArrivalAt && (
            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <FaCalendarAlt className="w-4 h-4" />
              <span>Est. Arrival: {new Date(shipment.estimatedArrivalAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {shipment.notes && (
          <>
            <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A]" />
            <div>
              <h4 className="text-sm font-semibold text-[#0A2E4A] dark:text-white mb-2 flex items-center gap-2">
                <FaStickyNote className="w-4 h-4 text-[#94A3B8]" />
                Notes
              </h4>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{shipment.notes}</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
