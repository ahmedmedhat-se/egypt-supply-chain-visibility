import { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { useCheckpoints } from '../../../hooks/useCheckpoints';
import { useAddRouteCheckpoint, useRemoveRouteCheckpoint } from '../../../hooks/useRoutes';
import { FaPlus, FaTrash, FaSearch } from 'react-icons/fa';
import type { Route, RouteCheckpoint } from '../../../types/route.types';
import type { Checkpoint } from '../../../types/checkpoint.types';

interface RouteCheckpointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
}

export const RouteCheckpointsModal = ({ isOpen, onClose, route }: RouteCheckpointsModalProps) => {
  const [selectedCheckpointId, setSelectedCheckpointId] = useState('');
  const [newSequence, setNewSequence] = useState('');
  const [cpSearch, setCpSearch] = useState('');

  // Search-driven so admins can reach checkpoints beyond the first page
  const { data: checkpointsData, isLoading: checkpointsLoading } = useCheckpoints({
    page: 1,
    limit: 50,
    search: cpSearch || undefined,
  });
  const { mutate: addCheckpoint, isPending: isAdding } = useAddRouteCheckpoint();
  const { mutate: removeCheckpoint, isPending: isRemoving } = useRemoveRouteCheckpoint();

  const allCheckpoints: Checkpoint[] = checkpointsData?.data || [];
  const routeCheckpoints: RouteCheckpoint[] = route?.checkpoints ?? [];
  const sortedRouteCheckpoints = [...routeCheckpoints].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );

  // Get checkpoints not already in this route
  const availableCheckpoints = allCheckpoints.filter(
    (cp) => !routeCheckpoints.some((rc) => rc.id === cp.id),
  );

  const suggestedSequence =
    routeCheckpoints.length > 0
      ? Math.max(...routeCheckpoints.map((rc) => rc.sequenceOrder)) + 1
      : 1;
  const currentRouteId = route?.id ?? null;
  const [prevRouteId, setPrevRouteId] = useState<string | null>(null);
  if (currentRouteId !== prevRouteId) {
    setPrevRouteId(currentRouteId);
    setNewSequence(String(suggestedSequence));
  }

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
                <div className="relative mb-2">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={cpSearch}
                    onChange={(e) => setCpSearch(e.target.value)}
                    placeholder="Search by name or code..."
                    className="w-full rounded-md border border-[#E2E8F0] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] pl-9 pr-3 py-2 text-sm text-[#1A2A3A] dark:text-white focus:border-[#0A2E4A] dark:focus:border-[#2D9B6E] focus:outline-none focus:ring-1 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E] placeholder:text-[#94A3B8]"
                  />
                </div>
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
