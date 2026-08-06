import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Pagination } from '../../ui/Pagination';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../ui/Table';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { EmptyState } from '../../ui/EmptyState';
import { Badge } from '../../ui/Badge';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaToggleOn, FaToggleOff, FaSearch } from 'react-icons/fa';
import { useCheckpoints, useActivateCheckpoint, useDeactivateCheckpoint } from '../../../hooks/useCheckpoints';
import { CheckpointModal } from './CheckpointModal';
import type { Checkpoint } from '../../../types/checkpoint.types';

export const CheckpointsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | undefined>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  const { data, isLoading } = useCheckpoints({
    page,
    limit,
    search: search || undefined,
  });
  const { mutate: activateCheckpoint, isPending: isActivating } = useActivateCheckpoint();
  const { mutate: deactivateCheckpoint, isPending: isDeactivating } = useDeactivateCheckpoint();

  const handleEdit = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCheckpoint(undefined);
  };

  const handleToggleActive = (checkpoint: Checkpoint) => {
    if (checkpoint.isActive) {
      deactivateCheckpoint(checkpoint.id);
    } else {
      activateCheckpoint(checkpoint.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Checkpoints</h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
            Manage physical transit locations
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <FaPlus /> New Checkpoint
          </Button>
        </div>
      </div>

      <Card variant="default">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : !data?.data?.length ? (
          <EmptyState
            icon={FaMapMarkerAlt}
            title={search ? 'No Results Found' : 'No Checkpoints Found'}
            description={
              search
                ? `No checkpoints match "${search}". Try a different search.`
                : 'Create your first checkpoint to start mapping the supply chain network.'
            }
            action={
              search ? undefined : (
                <Button onClick={() => setIsModalOpen(true)} variant="outline">
                  Create Checkpoint
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((checkpoint) => (
                <TableRow key={checkpoint.id}>
                  <TableCell className="font-medium text-[#0A2E4A]">{checkpoint.code}</TableCell>
                  <TableCell>{checkpoint.name}</TableCell>
                  <TableCell>
                    <span className="capitalize">{checkpoint.type.replace('_', ' ')}</span>
                  </TableCell>
                  <TableCell>{checkpoint.city}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleActive(checkpoint)}
                      disabled={isActivating || isDeactivating}
                      className="flex items-center gap-1.5"
                      title={checkpoint.isActive ? 'Deactivate checkpoint' : 'Activate checkpoint'}
                    >
                      {checkpoint.isActive ? (
                        <FaToggleOn className="w-5 h-5 text-[#2D9B6E]" />
                      ) : (
                        <FaToggleOff className="w-5 h-5 text-[#94A3B8]" />
                      )}
                      <Badge variant={checkpoint.isActive ? 'success' : 'default'} size="sm">
                        {checkpoint.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(checkpoint)} className="gap-2">
                      <FaEdit /> Edit
                    </Button>
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

      <CheckpointModal isOpen={isModalOpen} onClose={handleCloseModal} checkpoint={selectedCheckpoint} />
    </div>
  );
};
