import React from 'react'
import { WalletsSection } from '@/components/WalletsSection'
import { RPCSection } from '@/components/RPCSection'
import { PresetsSection } from '@/components/PresetsSection'
import { ErrorCenter } from '@/components/ErrorCenter'

export default function Terminal() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">DEX Trading Terminal</h1>
        <p className="text-muted-foreground mt-2">
          Manage your wallets, RPC endpoints, and trading presets
        </p>
      </div>

      <WalletsSection />
      <RPCSection />
      <PresetsSection />

      <ErrorCenter />
    </div>
  )
}