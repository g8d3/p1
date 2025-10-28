import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { presetStore } from '@/stores/presets'
import type { Preset, Entry, Exit, PriceValue, VolumeValue } from '@/types'
import { formatPercentage } from '@/lib/utils'
import { useErrorHandler } from '@/hooks/useErrorHandler'

export function PresetsSection() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPreset, setNewPreset] = useState({
    name: '',
    slippage: 0.5, // 0.5%
    entries: [] as Entry[],
    exits: [] as Exit[],
  })
  const { handleError } = useErrorHandler()

  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = async () => {
    try {
      const presetList = await presetStore.getAll()
      setPresets(presetList)
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleCreatePreset = async () => {
    try {
      if (!newPreset.name) {
        throw new Error('Preset name is required')
      }

      if (newPreset.entries.length === 0 && newPreset.exits.length === 0) {
        throw new Error('At least one entry or exit is required')
      }

      await presetStore.create(newPreset)

      setNewPreset({
        name: '',
        slippage: 0.5,
        entries: [],
        exits: [],
      })
      setIsCreateDialogOpen(false)
      await loadPresets()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const addEntry = () => {
    const newEntry: Entry = {
      id: crypto.randomUUID(),
      price: { type: 'percentage', value: 0 },
      volume: { type: 'percentage', value: 10 },
    }
    setNewPreset(prev => ({
      ...prev,
      entries: [...prev.entries, newEntry],
    }))
  }

  const addExit = () => {
    const newExit: Exit = {
      id: crypto.randomUUID(),
      price: { type: 'percentage', value: 10 },
      volume: { type: 'percentage', value: 25 },
    }
    setNewPreset(prev => ({
      ...prev,
      exits: [...prev.exits, newExit],
    }))
  }

  const updateEntry = (index: number, field: keyof Entry, value: any) => {
    setNewPreset(prev => ({
      ...prev,
      entries: prev.entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }))
  }

  const updateExit = (index: number, field: keyof Exit, value: any) => {
    setNewPreset(prev => ({
      ...prev,
      exits: prev.exits.map((exit, i) =>
        i === index ? { ...exit, [field]: value } : exit
      ),
    }))
  }

  const removeEntry = (index: number) => {
    setNewPreset(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index),
    }))
  }

  const removeExit = (index: number) => {
    setNewPreset(prev => ({
      ...prev,
      exits: prev.exits.filter((_, i) => i !== index),
    }))
  }

  const handleDeletePreset = async (presetId: string) => {
    try {
      await presetStore.delete(presetId)
      await loadPresets()
    } catch (error) {
      handleError(error as Error)
    }
  }



  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trading Presets</CardTitle>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Preset</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newPreset.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPreset(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Preset"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Default Slippage (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={newPreset.slippage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPreset(prev => ({ ...prev, slippage: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              {/* Entries */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Entries</label>
                  <Button type="button" size="sm" variant="outline" onClick={addEntry}>
                    Add Entry
                  </Button>
                </div>
                <div className="space-y-2">
                  {newPreset.entries.map((entry, index) => (
                    <div key={entry.id} className="flex gap-2 items-center p-2 border rounded">
                      <div className="flex-1">
                        <label className="text-xs">Price</label>
                        <div className="flex gap-1">
                          <Select
                            value={entry.price.type}
                            onValueChange={(value: 'absolute' | 'percentage') =>
                              updateEntry(index, 'price', { ...entry.price, type: value })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="absolute">Abs</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.price.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEntry(index, 'price', {
                              ...entry.price,
                              value: parseFloat(e.target.value) || 0
                            })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs">Volume</label>
                        <div className="flex gap-1">
                          <Select
                            value={entry.volume.type}
                            onValueChange={(value: 'absolute' | 'percentage') =>
                              updateEntry(index, 'volume', { ...entry.volume, type: value })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="absolute">Abs</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.volume.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEntry(index, 'volume', {
                              ...entry.volume,
                              value: parseFloat(e.target.value) || 0
                            })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeEntry(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Exits</label>
                  <Button type="button" size="sm" variant="outline" onClick={addExit}>
                    Add Exit
                  </Button>
                </div>
                <div className="space-y-2">
                  {newPreset.exits.map((exit, index) => (
                    <div key={exit.id} className="flex gap-2 items-center p-2 border rounded">
                      <div className="flex-1">
                        <label className="text-xs">Price</label>
                        <div className="flex gap-1">
                          <Select
                            value={exit.price.type}
                            onValueChange={(value: 'absolute' | 'percentage') =>
                              updateExit(index, 'price', { ...exit.price, type: value })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="absolute">Abs</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step="0.01"
                            value={exit.price.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateExit(index, 'price', {
                              ...exit.price,
                              value: parseFloat(e.target.value) || 0
                            })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs">Volume</label>
                        <div className="flex gap-1">
                          <Select
                            value={exit.volume.type}
                            onValueChange={(value: 'absolute' | 'percentage') =>
                              updateExit(index, 'volume', { ...exit.volume, type: value })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="absolute">Abs</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step="0.01"
                            value={exit.volume.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateExit(index, 'volume', {
                              ...exit.volume,
                              value: parseFloat(e.target.value) || 0
                            })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeExit(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreatePreset} className="w-full">
                Create Preset
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {presets.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No presets configured. Create your first trading preset.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slippage</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Exits</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presets.map((preset) => (
                <TableRow key={preset.id}>
                  <TableCell className="font-medium">{preset.name}</TableCell>
                  <TableCell>{formatPercentage(preset.slippage)}</TableCell>
                  <TableCell>{preset.entries.length}</TableCell>
                  <TableCell>{preset.exits.length}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePreset(preset.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}