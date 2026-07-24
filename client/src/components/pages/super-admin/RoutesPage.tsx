import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../ui/Table';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { EmptyState } from '../../ui/EmptyState';
import { Badge } from '../../ui/Badge';
import { FaRoute, FaPlus, FaEdit, FaMapSigns } from 'react-icons/fa';
import { useRoutes } from '../../../hooks/useRoutes';
import { RouteModal } from './RouteModal';
import type { Route } from '../../../types/route.types';

export const RoutesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | undefined>();
  
  const { data, isLoading } = useRoutes();

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoute(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Routes</h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
            Manage transit routes and pathways
          </p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <FaPlus /> New Route
        </Button>
      </div>

      <Card variant="default">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : !data?.data?.length ? (
          <EmptyState
            icon={FaRoute}
            title="No Routes Found"
            description="Create your first route to define pathways between checkpoints."
            action={
              <Button onClick={() => setIsModalOpen(true)} variant="outline">
                Create Route
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Origin / Destination</TableHead>
              <TableHead>Est. Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {data.data.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium text-[#0A2E4A]">{route.code}</TableCell>
                  <TableCell>{route.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-[#0A2E4A] dark:text-white">{route.originCity}</span>
                      <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                        <FaMapSigns className="w-3 h-3" /> to {route.destinationCity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{route.estimatedDays} Days</TableCell>
                  <TableCell>
                    <Badge variant={route.isActive ? 'success' : 'default'} size="sm">
                      {route.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(route)}>
                      <FaEdit className="mr-2" /> Edit
                    </Button>
                    <Button variant="default" size="sm">
                      Manage Checkpoints
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <RouteModal isOpen={isModalOpen} onClose={handleCloseModal} route={selectedRoute} />
    </div>
  );
};
