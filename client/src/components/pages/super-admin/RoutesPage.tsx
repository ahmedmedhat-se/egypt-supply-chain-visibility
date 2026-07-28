import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../ui/Table';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { EmptyState } from '../../ui/EmptyState';
import { Badge } from '../../ui/Badge';
import { FaRoute, FaPlus, FaEdit, FaMapSigns, FaToggleOn, FaToggleOff, FaLayerGroup } from 'react-icons/fa';
import { useRoutes, useActivateRoute, useDeactivateRoute } from '../../../hooks/useRoutes';
import { RouteModal } from './RouteModal';
import { RouteCheckpointsModal } from './RouteCheckpointsModal';
import type { Route } from '../../../types/route.types';

export const RoutesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | undefined>();
  const [checkpointsRoute, setCheckpointsRoute] = useState<Route | null>(null);

  const { data, isLoading } = useRoutes();
  const { mutate: activateRoute, isPending: isActivating } = useActivateRoute();
  const { mutate: deactivateRoute, isPending: isDeactivating } = useDeactivateRoute();

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoute(undefined);
  };

  const handleToggleActive = (route: Route) => {
    if (route.isActive) {
      deactivateRoute(route.id);
    } else {
      activateRoute(route.id);
    }
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
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Origin / Destination</TableHead>
                <TableHead>Checkpoints</TableHead>
                <TableHead>Est. Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
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
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <FaLayerGroup className="w-3.5 h-3.5 text-[#1E40AF]" />
                      {route.checkpoints?.length ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>{route.estimatedDays} Days</TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleActive(route)}
                      disabled={isActivating || isDeactivating}
                      className="flex items-center gap-1.5"
                      title={route.isActive ? 'Deactivate route' : 'Activate route'}
                    >
                      {route.isActive ? (
                        <FaToggleOn className="w-5 h-5 text-[#2D9B6E]" />
                      ) : (
                        <FaToggleOff className="w-5 h-5 text-[#94A3B8]" />
                      )}
                      <Badge variant={route.isActive ? 'success' : 'default'} size="sm">
                        {route.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(route)}>
                        <FaEdit className="mr-1.5" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCheckpointsRoute(route)}
                        className="flex items-center gap-1.5"
                      >
                        <FaLayerGroup className="w-3.5 h-3.5" />
                        Checkpoints
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <RouteModal isOpen={isModalOpen} onClose={handleCloseModal} route={selectedRoute} />
      <RouteCheckpointsModal
        isOpen={!!checkpointsRoute}
        onClose={() => setCheckpointsRoute(null)}
        route={checkpointsRoute}
      />
    </div>
  );
};
