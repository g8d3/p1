import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useWalletStore } from '@/stores/wallets';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { privateKeyToAccount } from 'viem/accounts';
import type { Wallet } from '@/types';

const WalletsSection = () => {
  const { wallets, activeWallet, isLoading, error, createWallet, setActiveWallet } = useWalletStore();
  const { handleError } = useErrorHandler();
  const [newWalletAlias, setNewWalletAlias] = useState('');
  const [newWalletPrivateKey, setNewWalletPrivateKey] = useState('');

  const handleCreateWallet = async () => {
    if (!newWalletAlias || !newWalletPrivateKey) return;

    try {
      // Derive address from private key
      const account = privateKeyToAccount(newWalletPrivateKey as `0x${string}`);
      const address = account.address;

      await createWallet({
        alias: newWalletAlias,
        chain: 'EVM',
        address,
        encryptedPrivateKey: newWalletPrivateKey,
        iv: '',
        salt: '',
        isActive: false,
      });

      setNewWalletAlias('');
      setNewWalletPrivateKey('');
    } catch (err) {
      handleError(err as Error, { alias: newWalletAlias }, 'WalletsSection');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Wallet Alias"
            value={newWalletAlias}
            onChange={(e) => setNewWalletAlias(e.target.value)}
          />
          <Input
            placeholder="Private Key"
            type="password"
            value={newWalletPrivateKey}
            onChange={(e) => setNewWalletPrivateKey(e.target.value)}
          />
          <Button onClick={handleCreateWallet} disabled={isLoading}>
            Create Wallet
          </Button>
          {error && <p className="text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alias</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet: Wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell>{wallet.alias}</TableCell>
                  <TableCell>{wallet.chain}</TableCell>
                  <TableCell className="font-mono text-sm">{wallet.address}</TableCell>
                  <TableCell>{wallet.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={activeWallet?.id === wallet.id ? 'default' : 'outline'}
                      onClick={() => setActiveWallet(wallet)}
                    >
                      {activeWallet?.id === wallet.id ? 'Active' : 'Set Active'}
                    </Button>
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

export default WalletsSection;