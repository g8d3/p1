import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useWalletStore } from '@/stores/wallets';
import { usePresetStore } from '@/stores/presets';
import { useRPCStore } from '@/stores/rpc';
import { useErrorStore } from '@/stores/errors';
import Terminal from '@/pages/Terminal';

function App() {
  const loadWallets = useWalletStore(state => state.loadWallets);
  const loadPresets = usePresetStore(state => state.loadPresets);
  const loadRPCs = useRPCStore(state => state.loadRPCs);
  const loadErrors = useErrorStore(state => state.loadErrors);

  useEffect(() => {
    // Load initial data
    loadWallets();
    loadPresets();
    loadRPCs();
    loadErrors();
  }, [loadWallets, loadPresets, loadRPCs, loadErrors]);

  return (
    <div className="min-h-screen bg-background">
      <Terminal />
      <Toaster />
    </div>
  );
}

export default App;
