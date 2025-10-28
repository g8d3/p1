import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { usePresetStore } from '@/stores/presets';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type { TradePreset, TradeEntry, TradeExit } from '@/types';

const PresetsSection = () => {
  const { presets, isLoading, error, createPreset, updatePreset } = usePresetStore();
  const { handleError } = useErrorHandler();
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetSlippage, setNewPresetSlippage] = useState('');
  const [editingPreset, setEditingPreset] = useState<TradePreset | null>(null);
  const [newEntryPrice, setNewEntryPrice] = useState('');
  const [newEntryVolume, setNewEntryVolume] = useState('');
  const [newExitPrice, setNewExitPrice] = useState('');
  const [newExitVolume, setNewExitVolume] = useState('');

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

  const handleAddEntry = () => {
    if (!editingPreset || !newEntryPrice || !newEntryVolume) return;

    const newEntry: TradeEntry = {
      price: newEntryPrice,
      volume: newEntryVolume,
    };

    const updatedEntries = [...editingPreset.entries, newEntry];
    setEditingPreset({ ...editingPreset, entries: updatedEntries });
    setNewEntryPrice('');
    setNewEntryVolume('');
  };

  const handleAddExit = () => {
    if (!editingPreset || !newExitPrice || !newExitVolume) return;

    const newExit: TradeExit = {
      price: newExitPrice,
      volume: newExitVolume,
    };

    const updatedExits = [...editingPreset.exits, newExit];
    setEditingPreset({ ...editingPreset, exits: updatedExits });
    setNewExitPrice('');
    setNewExitVolume('');
  };

  const handleSavePreset = async () => {
    if (!editingPreset) return;

    try {
      await updatePreset(editingPreset.id, {
        entries: editingPreset.entries,
        exits: editingPreset.exits,
      });
      setEditingPreset(null);
    } catch (err) {
      handleError(err as Error, { id: editingPreset.id }, 'PresetsSection');
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
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingPreset(preset)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Preset: {preset.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold">Entries</h4>
                            <div className="space-y-2">
                              {editingPreset?.entries.map((entry, index) => (
                                <div key={index} className="flex space-x-2">
                                  <span>Price: {entry.price}, Volume: {entry.volume}</span>
                                </div>
                              ))}
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Entry Price"
                                  value={newEntryPrice}
                                  onChange={(e) => setNewEntryPrice(e.target.value)}
                                />
                                <Input
                                  placeholder="Entry Volume"
                                  value={newEntryVolume}
                                  onChange={(e) => setNewEntryVolume(e.target.value)}
                                />
                                <Button onClick={handleAddEntry}>Add Entry</Button>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold">Exits</h4>
                            <div className="space-y-2">
                              {editingPreset?.exits.map((exit, index) => (
                                <div key={index} className="flex space-x-2">
                                  <span>Price: {exit.price}, Volume: {exit.volume}</span>
                                </div>
                              ))}
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Exit Price"
                                  value={newExitPrice}
                                  onChange={(e) => setNewExitPrice(e.target.value)}
                                />
                                <Input
                                  placeholder="Exit Volume"
                                  value={newExitVolume}
                                  onChange={(e) => setNewExitVolume(e.target.value)}
                                />
                                <Button onClick={handleAddExit}>Add Exit</Button>
                              </div>
                            </div>
                          </div>
                          <Button onClick={handleSavePreset} disabled={isLoading}>
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
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