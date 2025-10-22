import { ethers } from 'ethers'
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { Wallet } from './types'

export class WalletGenerator {
  static generateWallet(signature: string, index: number, network: string): Wallet {
    if (network === 'solana') {
      const seed = ethers.keccak256(ethers.toUtf8Bytes(signature + index.toString())).slice(2) // remove 0x
      const seedBytes = ethers.getBytes('0x' + seed)
      const keypair = nacl.sign.keyPair.fromSeed(seedBytes.slice(0, 32))
      const publicKey = bs58.encode(keypair.publicKey)
      const privateKey = ethers.hexlify(keypair.secretKey.slice(0, 32)) // private key is first 32 bytes

      return {
        id: `${signature}-${network}-${index}`,
        address: publicKey,
        privateKey,
        network,
        createdAt: new Date()
      }
    } else {
      // EVM
      const seed = ethers.keccak256(ethers.toUtf8Bytes(signature + index.toString()))
      const wallet = new ethers.Wallet(seed)

      return {
        id: `${signature}-${network}-${index}`,
        address: wallet.address,
        privateKey: wallet.privateKey,
        network,
        createdAt: new Date()
      }
    }
  }

  static generateWallets(signature: string, startIndex: number, count: number, network: string): Wallet[] {
    const wallets: Wallet[] = []
    for (let i = 0; i < count; i++) {
      wallets.push(this.generateWallet(signature, startIndex + i, network))
    }
    return wallets
  }
}