import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
// import { BtcWallet } from '@okxweb3/coin-bitcoin'
// import { EthWallet } from '@okxweb3/coin-ethereum'
// import { AptosWallet } from '@okxweb3/coin-aptos'
// import { CosmosWallet } from '@okxweb3/coin-cosmos'
// import { EosWallet } from '@okxweb3/coin-eos'
// import { StxWallet } from '@okxweb3/coin-stacks'
// import { StarknetWallet } from '@okxweb3/coin-starknet'
// import { SuiWallet } from '@okxweb3/coin-sui'
// import { NearWallet } from '@okxweb3/coin-near'
// import { TrxWallet } from '@okxweb3/coin-tron'
// import { TonWallet } from '@okxweb3/coin-ton'
// import { AdaWallet } from '@okxweb3/coin-cardano'
// import { SolWallet } from '@okxweb3/coin-solana'
// import { KaspaWallet } from '@okxweb3/coin-kaspa'
import './App.css'

declare global {
  interface Window {
    ethereum?: any
  }
}

interface Wallet {
  id: string
  network: string
  address: string
  privateKey: string
}

const networks = [
  'bitcoin', 'ethereum', 'aptos', 'cosmos', 'eos', 'stacks', 'starknet', 'sui', 'near', 'tron', 'ton', 'cardano', 'solana', 'kaspa'
]

function App() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [connected, setConnected] = useState(false)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets')
    if (savedWallets) {
      setWallets(JSON.parse(savedWallets))
    }
  }, [])

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      setSigner(signer)
      setConnected(true)
    } else {
      alert('Please install MetaMask')
    }
  }

  const generateWallets = async () => {
    if (!signer) return
    setLoading(true)
    const message = 'Generate wallets'
    const signature = await signer.signMessage(message)
    const seed = ethers.keccak256(signature)

    const newWallets: Wallet[] = []
    for (const network of networks) {
      const wallet = await generateWalletForNetwork(network, seed)
      newWallets.push(wallet)
    }
    setWallets(prev => [...prev, ...newWallets])
    localStorage.setItem('wallets', JSON.stringify([...wallets, ...newWallets]))
    setLoading(false)
  }

  const generateWalletForNetwork = async (network: string, seed: string): Promise<Wallet> => {
    const id = Date.now().toString() + Math.random()
    if (network === 'ethereum') {
      const wallet = new ethers.Wallet(seed)
      return {
        id,
        network,
        address: wallet.address,
        privateKey: seed
      }
    }
    // Placeholder for others
    return {
      id,
      network,
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      privateKey: `0x${Math.random().toString(16).substr(2, 64)}`
    }
  }

  const deleteWallet = (id: string) => {
    const updated = wallets.filter(w => w.id !== id)
    setWallets(updated)
    localStorage.setItem('wallets', JSON.stringify(updated))
  }

  return (
    <div className="app">
      <h1>Wallet Generator</h1>
      <p>App loaded</p>
      {!connected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected</p>
          <button onClick={generateWallets} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Wallets'}
          </button>
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Network</th>
            <th>Address</th>
            <th>Private Key</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map(wallet => (
            <tr key={wallet.id}>
              <td>{wallet.network}</td>
              <td>{wallet.address}</td>
              <td>{wallet.privateKey}</td>
              <td><button onClick={() => deleteWallet(wallet.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App