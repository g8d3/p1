import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { aggregatorStore } from '@/stores/aggregators'
import type { Aggregator } from '@/types'
import { useErrorHandler } from '@/hooks/useErrorHandler'

export function AggregatorsSection() {
  const [aggregators, setAggregators] = useState<Aggregator[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [newAggregator, setNewAggregator] = useState({
    name: '',
    type: '1inch' as '1inch' | 'jupiter',
    apiKey: '',
    isActive: true,
    priority: 1,
  })
  const { handleError } = useErrorHandler()

  useEffect(() => {
    if (!isInitialized) {
      loadAggregators()
      initializeAggregators()
      setIsInitialized(true)
    }
  }, [isInitialized])

  const loadAggregators = async () => {
    try {
      const aggregatorList = await aggregatorStore.getAll()
      setAggregators(aggregatorList)
    } catch (error) {
      handleError(error as Error)
    }
  }

  const initializeAggregators = async () => {
    try {
      await aggregatorStore.initializeDefaultAggregators()
      await loadAggregators()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleCreateAggregator = async () => {
    try {
      if (!newAggregator.name) {
        throw new Error('Name is required')
      }

      await aggregatorStore.create(newAggregator)

      setNewAggregator({ name: '', type: '1inch', apiKey: '', isActive: true, priority: 1 })
      setIsCreateDialogOpen(false)
      await loadAggregators()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await aggregatorStore.setActive(id, isActive)
      await loadAggregators()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleSetPriority = async (id: string, priority: number) => {
    try {
      await aggregatorStore.setPriority(id, priority)
      await loadAggregators()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleDeleteAggregator = async (id: string) => {
    try {
      await aggregatorStore.delete(id)
      await loadAggregators()
    } catch (error) {
      handleError(error as Error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Aggregators</CardTitle>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Aggregator</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Aggregator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newAggregator.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAggregator(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Aggregator"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newAggregator.type}
                  onValueChange={(value: '1inch' | 'jupiter') => setNewAggregator(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1inch">1inch (Multi-chain)</SelectItem>
                    <SelectItem value="jupiter">Jupiter (Solana)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">API Key (Optional)</label>
                <Input
                  type="password"
                  value={newAggregator.apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAggregator(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="For premium features"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={newAggregator.priority}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAggregator(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newAggregator.isActive}
                  onCheckedChange={(checked: boolean) => setNewAggregator(prev => ({ ...prev, isActive: checked }))}
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <Button onClick={handleCreateAggregator} className="w-full">
                Create Aggregator
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {aggregators.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No aggregators configured. Add your first aggregator to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregators.map((aggregator) => (
                <TableRow key={aggregator.id}>
                  <TableCell className="font-medium">{aggregator.name}</TableCell>
                  <TableCell className="capitalize">{aggregator.type}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={aggregator.priority}
                      onChange={(e) => handleSetPriority(aggregator.id, parseInt(e.target.value) || 1)}
                      className="w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={aggregator.isActive}
                      onCheckedChange={(checked: boolean) => handleToggleActive(aggregator.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteAggregator(aggregator.id)}
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