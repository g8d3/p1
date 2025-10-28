import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { walletStore } from '@/stores/wallets'
import { rpcStore } from '@/stores/rpc'
import type { Wallet } from '@/types'
import { formatAddress } from '@/lib/utils'
import { useErrorHandler } from '@/hooks/useErrorHandler'

export function WalletsSection() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newWallet, setNewWallet] = useState({
    name: '',
    address: '',
    chain: 'evm' as 'evm' | 'svm',
    privateKey: '',
  })
  const { handleError } = useErrorHandler()

  useEffect(() => {
    loadWallets()
    initializeRPCs()
  }, [])

  const loadWallets = async () => {
    try {
      const walletList = await walletStore.getAll()
      setWallets(walletList)
    } catch (error) {
      handleError(error as Error)
    }
  }

  const initializeRPCs = async () => {
    try {
      await rpcStore.initializeDefaultRPCs()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleCreateWallet = async () => {
    try {
      if (!newWallet.name || !newWallet.address) {
        throw new Error('Name and address are required')
      }

      await walletStore.create({
        name: newWallet.name,
        address: newWallet.address,
        chain: newWallet.chain,
        encryptedPrivateKey: newWallet.privateKey || undefined,
        isActive: wallets.length === 0, // Make first wallet active
      })

      setNewWallet({ name: '', address: '', chain: 'evm', privateKey: '' })
      setIsCreateDialogOpen(false)
      await loadWallets()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleSetActive = async (walletId: string) => {
    try {
      await walletStore.setActive(walletId)
      await loadWallets()
    } catch (error) {
      handleError(error as Error)
    }
  }

  const handleDeleteWallet = async (walletId: string) => {
    try {
      await walletStore.delete(walletId)
      await loadWallets()
    } catch (error) {
      handleError(error as Error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Wallets</CardTitle>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Wallet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newWallet.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWallet(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Wallet"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={newWallet.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWallet(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chain</label>
                <Select
                  value={newWallet.chain}
                  onValueChange={(value: 'evm' | 'svm') => setNewWallet(prev => ({ ...prev, chain: value }))}
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
              <div>
                <label className="text-sm font-medium">Private Key (Optional)</label>
                <Input
                  type="password"
                  value={newWallet.privateKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWallet(prev => ({ ...prev, privateKey: e.target.value }))}
                  placeholder="For imported wallets only"
                />
              </div>
              <Button onClick={handleCreateWallet} className="w-full">
                Create Wallet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {wallets.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No wallets configured. Add your first wallet to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatAddress(wallet.address)}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{wallet.chain}</span>
                  </TableCell>
                  <TableCell>
                    {wallet.isActive ? (
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
                      {!wallet.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(wallet.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteWallet(wallet.id)}
                      >
                        Delete
                      </Button>
                    </div>
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