import { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { useCheckpoints } from '../../../hooks/useCheckpoints';
import { useAddRouteCheckpoint, useRemoveRouteCheckpoint } from '../../../hooks/useRoutes';
import { FaPlus, FaTrash } from 'react-icons/fa';
import type { Route } from '../../../types/route.types';
import type { Checkpoint } from '../../../types/checkpoint.types';

// The backend returns flattened checkpoint data on routes, not nested under .checkpoint
interface FlatRouteCheckpoint {
  id: string;
  name: string;
  code: string;
  type: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  sequenceOrder: number;
}

interface RouteCheckpointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
}

export const RouteCheckpointsModal = ({ isOpen, onClose, route }: RouteCheckpointsModalProps) => {
  const [selectedCheckpointId, setSelectedCheckpointId] = useState('');
  const [newSequence, setNewSequence] = useState('');

  const { data: checkpointsData, isLoading: checkpointsLoading } = useCheckpoints();
  const { mutate: addCheckpoint, isPending: isAdding } = useAddRouteCheckpoint();
  const { mutate: removeCheckpoint, isPending: isRemoving } = useRemoveRouteCheckpoint();

  const allCheckpoints: Checkpoint[] = checkpointsData?.data || [];
  const rawRouteCheckpoints: any[] = route?.checkpoints || [];
  const routeCheckpoints: FlatRouteCheckpoint[] = rawRouteCheckpoints.map((rc) => ({
    id: rc.id || rc.checkpoint?.id,
    name: rc.name || rc.checkpoint?.name,
    code: rc.code || rc.checkpoint?.code,
    type: rc.type || rc.checkpoint?.type,
    city: rc.city || rc.checkpoint?.city,
    sequenceOrder: rc.sequenceOrder,
  }));
  const sortedRouteCheckpoints = [...routeCheckpoints].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  // Get checkpoints not already in this route
  const availableCheckpoints = allCheckpoints.filter(
    (cp) => !routeCheckpoints.some((rc) => rc.id === cp.id),
  );

  // Auto-set next sequence number
  useEffect(() => {
    if (routeCheckpoints.length > 0) {
      const maxSeq = Math.max(...routeCheckpoints.map((rc) => rc.sequenceOrder));
      setNewSequence((maxSeq + 1).toString());
    } else {
      setNewSequence('1');
    }
  }, [routeCheckpoints, isOpen]);

  const handleAdd = () => {
    if (!selectedCheckpointId || !newSequence || !route) return;
    addCheckpoint(
      {
        routeId: route.id,
        data: {
          checkpointId: selectedCheckpointId,
          sequenceOrder: parseInt(newSequence, 10),
        },
      },
      {
        onSuccess: () => {
          setSelectedCheckpointId('');
          if (routeCheckpoints.length > 0) {
            const maxSeq = Math.max(...routeCheckpoints.map((rc) => rc.sequenceOrder));
            setNewSequence((maxSeq + 2).toString());
          } else {
            setNewSequence('2');
          }
        },
      },
    );
  };

  const handleRemove = (checkpointId: string) => {
    if (!route) return;
    if (window.confirm('Remove this checkpoint from the route?')) {
      removeCheckpoint({ routeId: route.id, checkpointId });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Route Checkpoints — ${route?.name || ''}`} size="lg">
      <div className="space-y-6">
        {/* Current checkpoints */}
        <div>
          <h4 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider mb-3">
            Current Checkpoints ({sortedRouteCheckpoints.length})
          </h4>
          {sortedRouteCheckpoints.length === 0 ? (
            <p className="text-sm text-[#94A3B8] py-4 text-center border border-dashed border-[#E2E8F0] dark:border-[#1A3D5A] rounded-lg">
              No checkpoints attached to this route yet. Add some below.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedRouteCheckpoints.map((rc) => (
                <div
                  key={`${rc.id}-${rc.sequenceOrder}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1A3D5A]/50 border border-[#E2E8F0] dark:border-[#1A3D5A]"
                >
                  {/* Sequence badge */}
                  <div className="flex items-center gap-1">
                    <span className="w-6 h-6 rounded-full bg-[#0A2E4A] dark:bg-[#2D9B6E] text-white text-xs flex items-center justify-center font-medium">
                      {rc.sequenceOrder}
                    </span>
                  </div>

                  {/* Checkpoint info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A2A3A] dark:text-white truncate">
                      {rc.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                      <span className="capitalize">{rc.type?.replace('_', ' ') || '—'}</span>
                      <span>·</span>
                      <span>{rc.city || '—'}</span>
                      <span>·</span>
                      <span className="font-mono">{rc.code || '—'}</span>
                    </div>
                  </div>

                  {/* Remove button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(rc.id)}
                    disabled={isRemoving}
                    className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                  >
                    {isRemoving ? <LoadingSpinner size="sm" /> : <FaTrash className="w-3 h-3" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add checkpoint */}
        <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A] pt-4">
          <h4 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider mb-3">
            Add Checkpoint
          </h4>

          {checkpointsLoading ? (
            <div className="py-4 flex justify-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : availableCheckpoints.length === 0 ? (
            <p className="text-sm text-[#94A3B8] py-4 text-center border border-dashed border-[#E2E8F0] dark:border-[#1A3D5A] rounded-lg">
              All available checkpoints are already added to this route.
            </p>
          ) : (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Checkpoint</label>
                <select
                  value={selectedCheckpointId}
                  onChange={(e) => setSelectedCheckpointId(e.target.value)}
                  className="w-full rounded-md border border-[#E2E8F0] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] px-3 py-2 text-sm text-[#1A2A3A] dark:text-white focus:border-[#0A2E4A] dark:focus:border-[#2D9B6E] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E]"
                >
                  <option value="">Select checkpoint...</option>
                  {availableCheckpoints.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.name} ({cp.code}) — {cp.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Sequence</label>
                <input
                  type="number"
                  min="1"
                  value={newSequence}
                  onChange={(e) => setNewSequence(e.target.value)}
                  className="w-full rounded-md border border-[#E2E8F0] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] px-3 py-2 text-sm text-[#1A2A3A] dark:text-white focus:border-[#0A2E4A] dark:focus:border-[#2D9B6E] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E]"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!selectedCheckpointId || !newSequence || isAdding}
                className="flex items-center gap-1.5"
              >
                {isAdding ? <LoadingSpinner size="sm" /> : <FaPlus className="w-3 h-3" />}
                Add
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
