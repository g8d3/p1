import React, { useState } from 'react'
import { RPCConfig as RPCConfigType } from '../types'

interface RPCConfigProps {
  rpcConfigs: RPCConfigType[]
  selectedRpc: string
  onSelectRpc: (rpcId: string) => void
  onAddRpc: (rpc: Omit<RPCConfigType, 'id'>) => void
  onRemoveRpc: (rpcId: string) => void
}

export const RPCConfig: React.FC<RPCConfigProps> = ({
  rpcConfigs,
  selectedRpc,
  onSelectRpc,
  onAddRpc,
  onRemoveRpc
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRpc, setNewRpc] = useState({
    name: '',
    url: '',
    network: 'ethereum',
    chainId: ''
  })

  const handleAddRpc = () => {
    if (newRpc.name && newRpc.url) {
      onAddRpc({
        name: newRpc.name,
        url: newRpc.url,
        network: newRpc.network,
        chainId: newRpc.chainId ? parseInt(newRpc.chainId) : undefined
      })
      setNewRpc({ name: '', url: '', network: 'ethereum', chainId: '' })
      setShowAddForm(false)
    }
  }

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>RPC Configuration</h3>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Select RPC:
          <select
            value={selectedRpc}
            onChange={(e) => onSelectRpc(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            {rpcConfigs.map(rpc => (
              <option key={rpc.id} value={rpc.id}>
                {rpc.name} ({rpc.network})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '5px 10px' }}>
          {showAddForm ? 'Cancel' : 'Add RPC'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '3px' }}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="RPC Name"
              value={newRpc.name}
              onChange={(e) => setNewRpc({ ...newRpc, name: e.target.value })}
              style={{ marginRight: '10px', padding: '5px', width: '150px' }}
            />
            <input
              type="text"
              placeholder="RPC URL"
              value={newRpc.url}
              onChange={(e) => setNewRpc({ ...newRpc, url: e.target.value })}
              style={{ marginRight: '10px', padding: '5px', width: '250px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <select
              value={newRpc.network}
              onChange={(e) => setNewRpc({ ...newRpc, network: e.target.value })}
              style={{ marginRight: '10px', padding: '5px' }}
            >
              <option value="ethereum">Ethereum</option>
              <option value="solana">Solana</option>
            </select>
            {newRpc.network === 'ethereum' && (
              <input
                type="number"
                placeholder="Chain ID"
                value={newRpc.chainId}
                onChange={(e) => setNewRpc({ ...newRpc, chainId: e.target.value })}
                style={{ padding: '5px', width: '80px' }}
              />
            )}
          </div>
          <button onClick={handleAddRpc} style={{ padding: '5px 10px' }}>Add</button>
        </div>
      )}

      <div>
        <h4>Configured RPCs:</h4>
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {rpcConfigs.map(rpc => (
            <div key={rpc.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '5px',
              borderBottom: '1px solid #eee'
            }}>
              <div>
                <strong>{rpc.name}</strong> - {rpc.url} ({rpc.network})
                {rpc.chainId && ` - Chain ID: ${rpc.chainId}`}
              </div>
              <button
                onClick={() => onRemoveRpc(rpc.id)}
                style={{ padding: '2px 5px', fontSize: '12px' }}
                disabled={rpcConfigs.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}