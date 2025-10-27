import React, { useState } from 'react'
import { TransactionTemplate, Wallet } from '../types'

interface TransactionBuilderProps {
  wallets: Wallet[]
  onBuildTransaction: (template: TransactionTemplate) => void
  onSignAndBroadcast: (walletId: string, template: TransactionTemplate) => void
}

export const TransactionBuilder: React.FC<TransactionBuilderProps> = ({
  wallets,
  onBuildTransaction,
  onSignAndBroadcast
}) => {
  const [transactionType, setTransactionType] = useState<'transfer' | 'contract_call' | 'custom'>('transfer')
  const [to, setTo] = useState('')
  const [value, setValue] = useState('')
  const [data, setData] = useState('')
  const [gasLimit, setGasLimit] = useState('')
  const [gasPrice, setGasPrice] = useState('')
  const [maxFeePerGas, setMaxFeePerGas] = useState('')
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState('')
  const [selectedWallet, setSelectedWallet] = useState('')

  const handleBuildTransaction = () => {
    const template: TransactionTemplate = {
      type: transactionType,
      to: to || undefined,
      value: value || undefined,
      data: data || undefined,
      gasLimit: gasLimit || undefined,
      gasPrice: gasPrice || undefined,
      maxFeePerGas: maxFeePerGas || undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas || undefined
    }
    onBuildTransaction(template)
  }

  const handleSignAndBroadcast = () => {
    if (!selectedWallet) {
      alert('Please select a wallet')
      return
    }
    const template: TransactionTemplate = {
      type: transactionType,
      to: to || undefined,
      value: value || undefined,
      data: data || undefined,
      gasLimit: gasLimit || undefined,
      gasPrice: gasPrice || undefined,
      maxFeePerGas: maxFeePerGas || undefined,
      maxPriorityFeePerGas: maxPriorityFeePerGas || undefined
    }
    onSignAndBroadcast(selectedWallet, template)
  }

  const resetForm = () => {
    setTo('')
    setValue('')
    setData('')
    setGasLimit('')
    setGasPrice('')
    setMaxFeePerGas('')
    setMaxPriorityFeePerGas('')
  }

  return (
    <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Transaction Builder</h3>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Transaction Type:
          <select
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value as any)
              resetForm()
            }}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="transfer">Transfer (ETH/SOL)</option>
            <option value="contract_call">Contract Call</option>
            <option value="custom">Custom Transaction</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          From Wallet:
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', minWidth: '200px' }}
          >
            <option value="">Select wallet...</option>
            {wallets.map(wallet => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.address} ({wallet.network})
              </option>
            ))}
          </select>
        </label>
      </div>

      {(transactionType === 'transfer' || transactionType === 'contract_call') && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            To Address:
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            />
          </label>
        </div>
      )}

      {(transactionType === 'transfer' || transactionType === 'custom') && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Value (in wei for ETH, lamports for SOL):
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="1000000000000000000"
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </label>
        </div>
      )}

      {(transactionType === 'contract_call' || transactionType === 'custom') && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Data (hex):
            <textarea
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="0x..."
              rows={3}
              style={{ marginLeft: '10px', padding: '5px', width: '400px', fontFamily: 'monospace' }}
            />
          </label>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h4>Gas Settings (EVM only):</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <label>
            Gas Limit:
            <input
              type="text"
              value={gasLimit}
              onChange={(e) => setGasLimit(e.target.value)}
              placeholder="21000"
              style={{ marginLeft: '5px', padding: '5px', width: '80px' }}
            />
          </label>
          <label>
            Gas Price:
            <input
              type="text"
              value={gasPrice}
              onChange={(e) => setGasPrice(e.target.value)}
              placeholder="20000000000"
              style={{ marginLeft: '5px', padding: '5px', width: '100px' }}
            />
          </label>
          <label>
            Max Fee:
            <input
              type="text"
              value={maxFeePerGas}
              onChange={(e) => setMaxFeePerGas(e.target.value)}
              placeholder="40000000000"
              style={{ marginLeft: '5px', padding: '5px', width: '100px' }}
            />
          </label>
          <label>
            Priority Fee:
            <input
              type="text"
              value={maxPriorityFeePerGas}
              onChange={(e) => setMaxPriorityFeePerGas(e.target.value)}
              placeholder="2000000000"
              style={{ marginLeft: '5px', padding: '5px', width: '100px' }}
            />
          </label>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleBuildTransaction} style={{ marginRight: '10px', padding: '8px 15px' }}>
          Build Transaction
        </button>
        <button onClick={handleSignAndBroadcast} style={{ padding: '8px 15px' }}>
          Sign & Broadcast
        </button>
      </div>
    </div>
  )
}