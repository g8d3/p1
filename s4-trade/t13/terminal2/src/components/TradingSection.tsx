import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { aggregatorStore } from '@/stores/aggregators'
import { walletStore } from '@/stores/wallets'
import { rpcStore } from '@/stores/rpc'
import { AggregatorManager, type QuoteResponse } from '@/services/aggregators'
import type { Aggregator, Wallet, RPC } from '@/types'
import { useErrorHandler } from '@/hooks/useErrorHandler'

export function TradingSection() {
  const [aggregators, setAggregators] = useState<Aggregator[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [rpcs, setRpcs] = useState<RPC[]>([])
  const [quotes, setQuotes] = useState<QuoteResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [tradeParams, setTradeParams] = useState({
    fromToken: '',
    toToken: '',
    amount: '',
    walletId: '',
    rpcId: '',
    slippage: 0.5,
  })

  const { handleError } = useErrorHandler()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [aggregatorList, walletList, rpcList] = await Promise.all([
        aggregatorStore.getActive(),
        walletStore.getAll(),
        rpcStore.getAll(),
      ])
      setAggregators(aggregatorList)
      setWallets(walletList)
      setRpcs(rpcList)
    } catch (error) {
      handleError(error as Error)
    }
  }

  const getQuotes = async () => {
    if (!tradeParams.fromToken || !tradeParams.toToken || !tradeParams.amount || !tradeParams.walletId) {
      handleError(new Error('Please fill in all required fields'))
      return
    }

    setIsLoading(true)
    setQuotes([])

    try {
      const wallet = wallets.find(w => w.id === tradeParams.walletId)
      const rpc = rpcs.find(r => r.id === tradeParams.rpcId)

      if (!wallet || !rpc) {
        throw new Error('Invalid wallet or RPC selection')
      }

      const aggregatorManager = new AggregatorManager(aggregators)

      // Convert chain names to IDs
      const chainId = wallet.chain === 'evm' ? 1 : 101 // Default to Ethereum mainnet or Solana mainnet

      const quoteRequest = {
        fromTokenAddress: tradeParams.fromToken,
        toTokenAddress: tradeParams.toToken,
        amount: tradeParams.amount,
        chainId,
        slippage: tradeParams.slippage,
      }

      const quoteResults = await aggregatorManager.getBestQuote(quoteRequest)
      setQuotes(quoteResults)
    } catch (error) {
      handleError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAmount = (amount: string, decimals: number = 18) => {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(6)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trade Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">From Token</label>
            <Input
              placeholder="0x..."
              value={tradeParams.fromToken}
              onChange={(e) => setTradeParams(prev => ({ ...prev, fromToken: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">To Token</label>
            <Input
              placeholder="0x..."
              value={tradeParams.toToken}
              onChange={(e) => setTradeParams(prev => ({ ...prev, toToken: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="0.0"
              value={tradeParams.amount}
              onChange={(e) => setTradeParams(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Wallet</label>
            <Select value={tradeParams.walletId} onValueChange={(value) => setTradeParams(prev => ({ ...prev, walletId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name} ({wallet.chain.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">RPC</label>
            <Select value={tradeParams.rpcId} onValueChange={(value) => setTradeParams(prev => ({ ...prev, rpcId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select RPC" />
              </SelectTrigger>
              <SelectContent>
                {rpcs.filter(rpc => rpc.isActive).map((rpc) => (
                  <SelectItem key={rpc.id} value={rpc.id}>
                    {rpc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Slippage (%)</label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              value={tradeParams.slippage}
              onChange={(e) => setTradeParams(prev => ({ ...prev, slippage: parseFloat(e.target.value) || 0.5 }))}
            />
          </div>
        </div>

        <Button onClick={getQuotes} disabled={isLoading} className="w-full">
          {isLoading ? 'Getting Quotes...' : 'Get Quotes'}
        </Button>

        {/* Quotes Display */}
        {quotes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Quotes</h3>
            <div className="grid gap-4">
              {quotes.map((quote, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{quote.aggregator}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Gas: {quote.estimatedGas}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="font-medium">
                        {formatAmount(quote.fromTokenAmount, quote.fromToken.decimals)} {quote.fromToken.symbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">To</p>
                      <p className="font-medium">
                        {formatAmount(quote.toTokenAmount, quote.toToken.decimals)} {quote.toToken.symbol}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Execute Trade
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}