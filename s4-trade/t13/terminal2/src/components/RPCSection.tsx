import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { rpcStore } from '@/stores/rpc'
import type { RPC } from '@/types'
import { useErrorHandler } from '@/hooks/useErrorHandler'

export function RPCSection() {
  const [rpcs, setRpcs] = useState<RPC[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [newRPC, setNewRPC] = useState({
    name: '',
    url: '',
    chain: 'evm' as 'evm' | 'svm',
  })
  const { handleError } = useErrorHandler()

  useEffect(() => {
    if (!isInitialized) {
      loadRPCs()
      initializeRPCs()
      setIsInitialized(true)
    }
  }, [isInitialized])

  const initializeRPCs = async () => {
    try {
      await rpcStore.initializeDefaultRPCs()
      await loadRPCs()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const loadRPCs = async () => {
    try {
      const rpcList = await rpcStore.getAll()
      setRpcs(rpcList)
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleCreateRPC = async () => {
    try {
      if (!newRPC.name || !newRPC.url) {
        throw new Error('Name and URL are required')
      }

      await rpcStore.create({
        name: newRPC.name,
        url: newRPC.url,
        chain: newRPC.chain,
        isDefault: false,
        isActive: false,
      })

      setNewRPC({ name: '', url: '', chain: 'evm' })
      setIsCreateDialogOpen(false)
      await loadRPCs()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleSetActive = async (rpcId: string) => {
    try {
      await rpcStore.setActive(rpcId)
      await loadRPCs()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleDeleteRPC = async (rpcId: string) => {
    try {
      const rpc = rpcs.find(r => r.id === rpcId)
      if (rpc?.isDefault) {
        throw new Error('Cannot delete default RPC endpoints')
      }

      await rpcStore.delete(rpcId)
      await loadRPCs()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const evmRpcs = rpcs.filter(rpc => rpc.chain === 'evm')
  const svmRpcs = rpcs.filter(rpc => rpc.chain === 'svm')

  return (
    <div className="space-y-6">
      {/* EVM RPCs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>EVM RPC Endpoints</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add RPC</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New RPC Endpoint</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                <Input
                  value={newRPC.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRPC(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My RPC"
                />
                </div>
                <div>
                  <label className="text-sm font-medium">URL</label>
                <Input
                  value={newRPC.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRPC(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
                </div>
                <div>
                  <label className="text-sm font-medium">Chain</label>
                  <Select
                    value={newRPC.chain}
                    onValueChange={(value: 'evm' | 'svm') => setNewRPC(prev => ({ ...prev, chain: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="evm">EVM (Ethereum)</SelectItem>
                      <SelectItem value="svm">SVM (Solana)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateRPC} className="w-full">
                  Create RPC
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evmRpcs.map((rpc) => (
                <TableRow key={rpc.id}>
                  <TableCell className="font-medium">
                    {rpc.name}
                    {rpc.isDefault && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm max-w-xs truncate">
                    {rpc.url}
                  </TableCell>
                  <TableCell>
                    {rpc.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!rpc.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(rpc.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      {!rpc.isDefault && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRPC(rpc.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SVM RPCs */}
      <Card>
        <CardHeader>
          <CardTitle>SVM RPC Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {svmRpcs.map((rpc) => (
                <TableRow key={rpc.id}>
                  <TableCell className="font-medium">
                    {rpc.name}
                    {rpc.isDefault && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm max-w-xs truncate">
                    {rpc.url}
                  </TableCell>
                  <TableCell>
                    {rpc.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!rpc.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(rpc.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      {!rpc.isDefault && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRPC(rpc.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}