import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../ui/Table';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { EmptyState } from '../../ui/EmptyState';
import { Badge } from '../../ui/Badge';
import { FaMapMarkerAlt, FaPlus, FaEdit } from 'react-icons/fa';
import { useCheckpoints } from '../../../hooks/useCheckpoints';
import { CheckpointModal } from './CheckpointModal';
import type { Checkpoint } from '../../../types/checkpoint.types';

export const CheckpointsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | undefined>();
  
  const { data, isLoading } = useCheckpoints();

  const handleEdit = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCheckpoint(undefined);
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
        
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <FaPlus /> New Checkpoint
        </Button>
      </div>

      <Card variant="default">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : !data?.data?.length ? (
          <EmptyState
            icon={FaMapMarkerAlt}
            title="No Checkpoints Found"
            description="Create your first checkpoint to start mapping the supply chain network."
            action={
              <Button onClick={() => setIsModalOpen(true)} variant="outline">
                Create Checkpoint
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    <Badge variant={checkpoint.isActive ? 'success' : 'default'} size="sm">
                      {checkpoint.isActive ? 'Active' : 'Inactive'}
                    </Badge>
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

      <CheckpointModal isOpen={isModalOpen} onClose={handleCloseModal} checkpoint={selectedCheckpoint} />
    </div>
  );
};
