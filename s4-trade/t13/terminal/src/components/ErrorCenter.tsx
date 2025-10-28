import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useErrorStore } from '@/stores/errors';
import type { ErrorLog } from '@/types';

const ErrorCenter = () => {
  const { errors, clearErrors, exportErrors } = useErrorStore();

  const handleExport = async () => {
    const data = await exportErrors();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'errors.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Error Center
          <div className="space-x-2">
            <Button variant="outline" onClick={clearErrors}>
              Clear All
            </Button>
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Component</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((error: ErrorLog) => (
              <TableRow key={error.id}>
                <TableCell>{error.timestamp.toLocaleString()}</TableCell>
                <TableCell className={`font-medium ${
                  error.level === 'error' ? 'text-destructive' :
                  error.level === 'warn' ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  {error.level.toUpperCase()}
                </TableCell>
                <TableCell>{error.message}</TableCell>
                <TableCell>{error.component || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {errors.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No errors logged.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorCenter;