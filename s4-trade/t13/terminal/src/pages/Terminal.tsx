import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WalletsSection from '@/components/WalletsSection';
import PresetsSection from '@/components/PresetsSection';
import RPCSection from '@/components/RPCSection';
import ErrorCenter from '@/components/ErrorCenter';

const Terminal = () => {
  const [activeTab, setActiveTab] = useState<'wallets' | 'presets' | 'rpc' | 'trade' | 'errors'>('wallets');

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
            <CardContent>
              <p>Trade execution interface coming soon...</p>
            </CardContent>
          </Card>
        )}
        {activeTab === 'errors' && <ErrorCenter />}
      </main>
    </div>
  );
};

export default Terminal;