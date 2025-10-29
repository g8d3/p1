import type { Aggregator, RPC } from '../types'

export interface QuoteRequest {
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  chainId: number
  slippage?: number
}

export interface QuoteResponse {
  fromToken: TokenInfo
  toToken: TokenInfo
  fromTokenAmount: string
  toTokenAmount: string
  estimatedGas: string
  protocols?: any[]
  aggregator: '1inch' | 'jupiter'
}

export interface SwapRequest extends QuoteRequest {
  fromAddress: string
  slippage: number
}

export interface SwapResponse {
  fromToken: TokenInfo
  toToken: TokenInfo
  fromTokenAmount: string
  toTokenAmount: string
  toTokenAmountMin: string
  tx: TransactionData
  aggregator: '1inch' | 'jupiter'
}

export interface TokenInfo {
  address: string
  symbol: string
  decimals: number
  name?: string
  logoURI?: string
}

export interface TransactionData {
  from: string
  to: string
  data: string
  value: string
  gas?: string
  gasPrice?: string
}

export abstract class AggregatorService {
  abstract readonly name: '1inch' | 'jupiter'
  abstract readonly supportedChains: number[]

  constructor(protected config: Aggregator) {}

  abstract getQuote(request: QuoteRequest): Promise<QuoteResponse>
  abstract getSwap(request: SwapRequest): Promise<SwapResponse>
  abstract getTokens(chainId: number): Promise<TokenInfo[]>

  isSupported(chainId: number): boolean {
    return this.supportedChains.includes(chainId)
  }
}

export class OneInchService extends AggregatorService {
  readonly name = '1inch' as const
  readonly supportedChains = [1, 56, 137, 42161, 10, 43114] // ETH, BSC, Polygon, Arbitrum, Optimism, Avalanche

  private readonly baseUrl = 'https://api.1inch.io/v5.2'

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const url = new URL(`${request.chainId}/quote`, this.baseUrl)
    url.searchParams.set('fromTokenAddress', request.fromTokenAddress)
    url.searchParams.set('toTokenAddress', request.toTokenAddress)
    url.searchParams.set('amount', request.amount)
    if (request.slippage) {
      url.searchParams.set('slippage', request.slippage.toString())
    }

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`1inch quote failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      fromToken: {
        address: data.fromToken.address,
        symbol: data.fromToken.symbol,
        decimals: data.fromToken.decimals,
        name: data.fromToken.name,
        logoURI: data.fromToken.logoURI,
      },
      toToken: {
        address: data.toToken.address,
        symbol: data.toToken.symbol,
        decimals: data.toToken.decimals,
        name: data.toToken.name,
        logoURI: data.toToken.logoURI,
      },
      fromTokenAmount: data.fromTokenAmount,
      toTokenAmount: data.toTokenAmount,
      estimatedGas: data.estimatedGas,
      protocols: data.protocols,
      aggregator: '1inch',
    }
  }

  async getSwap(request: SwapRequest): Promise<SwapResponse> {
    const url = new URL(`${request.chainId}/swap`, this.baseUrl)
    url.searchParams.set('fromTokenAddress', request.fromTokenAddress)
    url.searchParams.set('toTokenAddress', request.toTokenAddress)
    url.searchParams.set('amount', request.amount)
    url.searchParams.set('fromAddress', request.fromAddress)
    url.searchParams.set('slippage', request.slippage.toString())

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`1inch swap failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      fromToken: {
        address: data.fromToken.address,
        symbol: data.fromToken.symbol,
        decimals: data.fromToken.decimals,
        name: data.fromToken.name,
        logoURI: data.fromToken.logoURI,
      },
      toToken: {
        address: data.toToken.address,
        symbol: data.toToken.symbol,
        decimals: data.toToken.decimals,
        name: data.toToken.name,
        logoURI: data.toToken.logoURI,
      },
      fromTokenAmount: data.fromTokenAmount,
      toTokenAmount: data.toTokenAmount,
      toTokenAmountMin: data.toTokenAmountMin,
      tx: {
        from: data.tx.from,
        to: data.tx.to,
        data: data.tx.data,
        value: data.tx.value,
        gas: data.tx.gas,
        gasPrice: data.tx.gasPrice,
      },
      aggregator: '1inch',
    }
  }

  async getTokens(chainId: number): Promise<TokenInfo[]> {
    const url = new URL(`${chainId}/tokens`, this.baseUrl)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`1inch tokens failed: ${response.statusText}`)
    }

    const data = await response.json()

    return Object.values(data.tokens).map((token: any) => ({
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      name: token.name,
      logoURI: token.logoURI,
    }))
  }
}

export class JupiterService extends AggregatorService {
  readonly name = 'jupiter' as const
  readonly supportedChains = [101, 102, 103] // Solana mainnet, devnet, testnet (mapped to chain IDs)

  private readonly baseUrl = 'https://quote-api.jup.ag/v6'

  // Map our chain IDs to Jupiter's network parameter
  private getNetworkParam(chainId: number): string {
    switch (chainId) {
      case 101: return 'mainnet-beta'
      case 102: return 'devnet'
      case 103: return 'testnet'
      default: return 'mainnet-beta'
    }
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const url = new URL('quote', this.baseUrl)
    url.searchParams.set('inputMint', request.fromTokenAddress)
    url.searchParams.set('outputMint', request.toTokenAddress)
    url.searchParams.set('amount', request.amount)
    url.searchParams.set('slippageBps', request.slippage ? (request.slippage * 100).toString() : '50')

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Jupiter quote failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      fromToken: {
        address: data.inputMint,
        symbol: data.inputMint, // Jupiter doesn't provide symbol in quote
        decimals: 9, // Default for SOL, would need token metadata for others
      },
      toToken: {
        address: data.outputMint,
        symbol: data.outputMint, // Jupiter doesn't provide symbol in quote
        decimals: 9, // Default for SOL, would need token metadata for others
      },
      fromTokenAmount: data.inAmount,
      toTokenAmount: data.outAmount,
      estimatedGas: '0', // Jupiter handles gas estimation differently
      aggregator: 'jupiter',
    }
  }

  async getSwap(request: SwapRequest): Promise<SwapResponse> {
    // First get quote
    const quote = await this.getQuote(request)

    // Then get swap instructions
    const url = new URL('swap', this.baseUrl)
    const swapRequest = {
      quoteResponse: quote, // This would need the full Jupiter quote response
      userPublicKey: request.fromAddress,
      wrapAndUnwrapSol: true,
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapRequest),
    })

    if (!response.ok) {
      throw new Error(`Jupiter swap failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      fromToken: quote.fromToken,
      toToken: quote.toToken,
      fromTokenAmount: quote.fromTokenAmount,
      toTokenAmount: quote.toTokenAmount,
      toTokenAmountMin: data.swapTransaction.outAmount || quote.toTokenAmount,
      tx: {
        from: request.fromAddress,
        to: '', // Jupiter provides serialized transaction
        data: data.swapTransaction, // This is the serialized transaction
        value: '0',
      },
      aggregator: 'jupiter',
    }
  }

  async getTokens(chainId: number): Promise<TokenInfo[]> {
    // Jupiter doesn't have a direct token list endpoint
    // In a real implementation, you'd use the token metadata API or a cached list
    // For now, return empty array
    return []
  }
}

export class AggregatorManager {
  private services: Map<string, AggregatorService> = new Map()

  constructor(aggregators: Aggregator[]) {
    for (const config of aggregators) {
      if (config.name === '1inch' && config.isActive) {
        this.services.set('1inch', new OneInchService(config))
      } else if (config.name === 'jupiter' && config.isActive) {
        this.services.set('jupiter', new JupiterService(config))
      }
    }
  }

  getAggregator(name: '1inch' | 'jupiter'): AggregatorService | undefined {
    return this.services.get(name)
  }

  getAvailableAggregators(chainId: number): AggregatorService[] {
    return Array.from(this.services.values()).filter(service => service.isSupported(chainId))
  }

  async getBestQuote(request: QuoteRequest): Promise<QuoteResponse[]> {
    const availableServices = this.getAvailableAggregators(request.chainId)
    const quotes: QuoteResponse[] = []

    // Create promises with timeout for each aggregator
    const quotePromises = availableServices.map(async (service) => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )

        const quotePromise = service.getQuote(request)
        const quote = await Promise.race([quotePromise, timeoutPromise])
        return { service: service.name, quote, error: null }
      } catch (error) {
        return { service: service.name, quote: null, error: error as Error }
      }
    })

    // Wait for all quotes to complete
    const results = await Promise.all(quotePromises)

    // Process results
    for (const result of results) {
      if (result.quote) {
        quotes.push(result.quote)
      } else if (result.error) {
        console.warn(`Failed to get quote from ${result.service}:`, result.error.message)
      }
    }

    // Sort quotes by output amount (best deals first)
    quotes.sort((a, b) => parseFloat(b.toTokenAmount) - parseFloat(a.toTokenAmount))

    return quotes
  }
}