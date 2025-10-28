import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WalletsSection from '@/components/WalletsSection';
import PresetsSection from '@/components/PresetsSection';
import RPCSection from '@/components/RPCSection';
import ErrorCenter from '@/components/ErrorCenter';
import { useWalletStore } from '@/stores/wallets';
import { usePresetStore } from '@/stores/presets';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type { TradePreset } from '@/types';

const Terminal = () => {
  const [activeTab, setActiveTab] = useState<'wallets' | 'presets' | 'rpc' | 'trade' | 'errors'>('wallets');
  const [contractAddress, setContractAddress] = useState('');
  const [chain, setChain] = useState<'EVM' | 'SVM'>('EVM');
  const [selectedPreset, setSelectedPreset] = useState<TradePreset | null>(null);

  const { activeWallet, loadWallets } = useWalletStore();
  const { presets, loadPresets } = usePresetStore();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    loadWallets();
    loadPresets();
  }, [loadWallets, loadPresets]);

  const handleSetEntries = () => {
    if (!activeWallet || !selectedPreset || !contractAddress) {
      handleError(new Error('Missing required fields'), {}, 'Terminal');
      return;
    }

    // Simulate setting entries
    console.log('Setting entries for contract:', contractAddress, 'with preset:', selectedPreset.name, 'using wallet:', activeWallet.alias);
    alert(`Entries set for ${contractAddress} using ${selectedPreset.name} with wallet ${activeWallet.alias}`);
  };

  const handleSetExits = () => {
    if (!activeWallet || !selectedPreset || !contractAddress) {
      handleError(new Error('Missing required fields'), {}, 'Terminal');
      return;
    }

    // Simulate setting exits
    console.log('Setting exits for contract:', contractAddress, 'with preset:', selectedPreset.name, 'using wallet:', activeWallet.alias);
    alert(`Exits set for ${contractAddress} using ${selectedPreset.name} with wallet ${activeWallet.alias}`);
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">DEX Trading Terminal</h1>
        <p className="text-muted-foreground">Non-custodial, multi-chain trading</p>
      </header>

      <nav className="mb-6">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'wallets' ? 'default' : 'outline'}
            onClick={() => setActiveTab('wallets')}
          >
            Wallets
          </Button>
          <Button
            variant={activeTab === 'presets' ? 'default' : 'outline'}
            onClick={() => setActiveTab('presets')}
          >
            Presets
          </Button>
          <Button
            variant={activeTab === 'rpc' ? 'default' : 'outline'}
            onClick={() => setActiveTab('rpc')}
          >
            RPC
          </Button>
          <Button
            variant={activeTab === 'trade' ? 'default' : 'outline'}
            onClick={() => setActiveTab('trade')}
          >
            Trade
          </Button>
          <Button
            variant={activeTab === 'errors' ? 'default' : 'outline'}
            onClick={() => setActiveTab('errors')}
          >
            Error Center
          </Button>
        </div>
      </nav>

      <main>
        {activeTab === 'wallets' && <WalletsSection />}
        {activeTab === 'presets' && <PresetsSection />}
        {activeTab === 'rpc' && <RPCSection />}
        {activeTab === 'trade' && (
          <Card>
            <CardHeader>
              <CardTitle>Trade Execution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chain</label>
                <Select value={chain} onValueChange={(value: 'EVM' | 'SVM') => setChain(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVM">EVM</SelectItem>
                    <SelectItem value="SVM">SVM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contract Address</label>
                <Input
                  placeholder={`Enter ${chain} contract address`}
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preset</label>
                <Select
                  value={selectedPreset?.id || ''}
                  onValueChange={(value) => {
                    const preset = presets.find(p => p.id === value);
                    setSelectedPreset(preset || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Active Wallet</label>
                <div className="p-2 bg-muted rounded">
                  {activeWallet ? (
                    <span>{activeWallet.alias} ({activeWallet.chain}) - {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}</span>
                  ) : (
                    <span className="text-muted-foreground">No active wallet</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSetEntries} disabled={!activeWallet || !selectedPreset || !contractAddress}>
                  Set Entries
                </Button>
                <Button onClick={handleSetExits} disabled={!activeWallet || !selectedPreset || !contractAddress}>
                  Set Exits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {activeTab === 'errors' && <ErrorCenter />}
      </main>
    </div>
  );
};

export default Terminal;