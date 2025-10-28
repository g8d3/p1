import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { usePresetStore } from '@/stores/presets';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type { TradePreset } from '@/types';

const PresetsSection = () => {
  const { presets, isLoading, error, createPreset } = usePresetStore();
  const { handleError } = useErrorHandler();
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetSlippage, setNewPresetSlippage] = useState('');

  const handleCreatePreset = async () => {
    if (!newPresetName || !newPresetSlippage) return;

    try {
      await createPreset({
        name: newPresetName,
        slippage: parseFloat(newPresetSlippage),
        entries: [],
        exits: [],
        executionMode: 'sequential',
        cooldown: 0,
      });

      setNewPresetName('');
      setNewPresetSlippage('');
    } catch (err) {
      handleError(err as Error, { name: newPresetName }, 'PresetsSection');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Preset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Preset Name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
          />
          <Input
            placeholder="Default Slippage (%)"
            type="number"
            value={newPresetSlippage}
            onChange={(e) => setNewPresetSlippage(e.target.value)}
          />
          <Button onClick={handleCreatePreset} disabled={isLoading}>
            Create Preset
          </Button>
          {error && <p className="text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slippage</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Exits</TableHead>
                <TableHead>Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presets.map((preset: TradePreset) => (
                <TableRow key={preset.id}>
                  <TableCell>{preset.name}</TableCell>
                  <TableCell>{preset.slippage}%</TableCell>
                  <TableCell>{preset.entries.length}</TableCell>
                  <TableCell>{preset.exits.length}</TableCell>
                  <TableCell>{preset.executionMode}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PresetsSection;