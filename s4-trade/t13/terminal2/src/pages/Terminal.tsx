import React from 'react'
import { WalletsSection } from '@/components/WalletsSection'
import { RPCSection } from '@/components/RPCSection'
import { AggregatorsSection } from '@/components/AggregatorsSection'
import { TradingSection } from '@/components/TradingSection'
import { PresetsSection } from '@/components/PresetsSection'
import { ErrorCenter } from '@/components/ErrorCenter'

export default function Terminal() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">DEX Trading Terminal</h1>
        <p className="text-muted-foreground mt-2">
          Manage your wallets, RPC endpoints, aggregators, and execute trades
        </p>
      </div>

      <WalletsSection />
      <RPCSection />
      <AggregatorsSection />
      <TradingSection />
      <PresetsSection />

      <ErrorCenter />
    </div>
  )
}