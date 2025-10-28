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
import { detectExtensions, connectWallet, type ExtensionInfo } from '@/utils/walletDerivation'

export function WalletsSection() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false)
  const [connectingExtension, setConnectingExtension] = useState<string | null>(null)
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
    detectWalletExtensions()
  }, [])

  const detectWalletExtensions = () => {
    const detectedExtensions = detectExtensions()
    setExtensions(detectedExtensions)
  }

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
        derivationType: 'imported',
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

  const handleConnectWallet = async (extensionType: 'metamask' | 'phantom') => {
    try {
      setConnectingExtension(extensionType)
      const walletData = await connectWallet(extensionType)

      // Check if wallet already exists
      const existingWallet = wallets.find(w => w.address.toLowerCase() === walletData.address.toLowerCase())
      if (existingWallet) {
        throw new Error(`Wallet with address ${formatAddress(walletData.address)} is already connected`)
      }

      // Generate a default name for derived wallet
      const extensionName = extensionType === 'metamask' ? 'MetaMask' : 'Phantom'
      let walletName = `${extensionName} Derived`
      let counter = 1

      // Ensure unique name
      while (wallets.some(w => w.name === walletName)) {
        walletName = `${extensionName} Derived ${counter}`
        counter++
      }

      await walletStore.create({
        ...walletData,
        name: walletName,
        isActive: wallets.length === 0, // Make first wallet active
      })

      setIsConnectDialogOpen(false)
      await loadWallets()
    } catch (error) {
      handleError(error as Error)
    } finally {
      setConnectingExtension(null)
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
        <div className="flex gap-2">
          <Dialog open={isConnectDialogOpen} onOpenChange={(open) => {
            setIsConnectDialogOpen(open)
            if (open) {
              detectWalletExtensions() // Refresh extensions when dialog opens
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">Connect Wallet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Derive Trading Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your browser wallet extension to create a new derived trading wallet. Your main wallet will sign a message to generate a unique trading address that this app controls.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Security:</strong> Your main wallet private key never leaves your browser extension. A new wallet is created for trading operations.
                  </p>
                </div>
                {extensions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No wallet extensions detected. Please install MetaMask or Phantom.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {extensions.map((extension) => (
                      <Button
                        key={extension.type}
                        onClick={() => handleConnectWallet(extension.type)}
                        disabled={connectingExtension === extension.type}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        {connectingExtension === extension.type ? (
                          <>Deriving...</>
                        ) : (
                          <>
                            <span className="mr-2">🔐</span>
                            Derive from {extension.name} ({extension.chain.toUpperCase()})
                          </>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Or import manually:</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIsConnectDialogOpen(false)
                      setIsCreateDialogOpen(true)
                    }}
                  >
                    Import Wallet Manually
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Import Wallet</Button>
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
        </div>
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
                <TableHead>Derived Address</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Source</TableHead>
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
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      wallet.derivationType === 'derived'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {wallet.derivationType === 'derived'
                        ? (wallet.extensionType === 'metamask' ? 'MetaMask' : 'Phantom')
                        : 'Manual Import'
                      }
                    </span>
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