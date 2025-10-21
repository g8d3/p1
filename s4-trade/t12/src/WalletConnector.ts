import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: any
  }
}

export class WalletConnector {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null

  async connect(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found. Please install MetaMask or another EVM-compatible wallet.')
    }

    this.provider = new ethers.BrowserProvider(window.ethereum)
    await this.provider.send('eth_requestAccounts', [])
    this.signer = await this.provider.getSigner()
    return await this.signer.getAddress()
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }
    return await this.signer.signMessage(message)
  }

  getSigner(): ethers.Signer | null {
    return this.signer
  }

  isConnected(): boolean {
    return this.signer !== null
  }
}