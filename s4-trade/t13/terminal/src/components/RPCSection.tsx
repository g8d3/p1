import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useRPCStore } from '@/stores/rpc';
import type { RPC } from '@/types';

const RPCSection = () => {
  const { rpcs, checkHealth } = useRPCStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>RPC Endpoints</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Healthy</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rpcs.map((rpc: RPC) => (
              <TableRow key={rpc.id}>
                <TableCell>{rpc.name}</TableCell>
                <TableCell>{rpc.chain}</TableCell>
                <TableCell className="font-mono text-sm">{rpc.url}</TableCell>
                <TableCell>{rpc.latency ? `${rpc.latency.toFixed(0)}ms` : 'N/A'}</TableCell>
                <TableCell>{rpc.successRate ? `${rpc.successRate.toFixed(1)}%` : 'N/A'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    rpc.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {rpc.isHealthy ? 'Healthy' : 'Unhealthy'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkHealth(rpc.id)}
                  >
                    Check Health
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RPCSection;