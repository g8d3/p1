import React, { useState } from 'react'
import { Wallet } from '../types'

interface WalletTableProps {
  wallets: Wallet[]
  onDelete: (id: string) => void
  onExport: (wallet: Wallet) => void
  onCopy: (address: string) => void
  onSignMessage?: (walletId: string) => void
  onSignTransaction?: (walletId: string) => void
}

export const WalletTable: React.FC<WalletTableProps> = ({
  wallets,
  onDelete,
  onExport,
  onCopy,
  onSignMessage,
  onSignTransaction
}) => {
  const [isDark, setIsDark] = useState(true)

  const theme = isDark ? 'dark' : 'light'

  return (
    <div className={`wallet-table-container ${theme}`}>
      <div className="theme-toggle">
        <button onClick={() => setIsDark(!isDark)}>
          {isDark ? 'Light' : 'Dark'} Theme
        </button>
      </div>
      <div className="table-wrapper">
        <table className="wallet-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Network</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map(wallet => (
              <tr key={wallet.id}>
                <td className="address-cell">{wallet.address}</td>
                <td>{wallet.network}</td>
                <td>{wallet.createdAt.toLocaleDateString()}</td>
                 <td>
                   <button onClick={() => onCopy(wallet.address)}>Copy</button>
                   <button onClick={() => onExport(wallet)}>Export</button>
                   {onSignMessage && <button onClick={() => onSignMessage(wallet.id)}>Sign Msg</button>}
                   {onSignTransaction && <button onClick={() => onSignTransaction(wallet.id)}>Sign Tx</button>}
                   <button onClick={() => onDelete(wallet.id)}>Delete</button>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .wallet-table-container {
          font-family: Arial, sans-serif;
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
        }
        .wallet-table-container.dark {
          background-color: #121212;
          color: #ffffff;
        }
        .wallet-table-container.light {
          background-color: #ffffff;
          color: #000000;
        }
        .theme-toggle {
          margin-bottom: 20px;
        }
        .theme-toggle button {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .table-wrapper {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #ddd;
        }
        .wallet-table-container.dark .table-wrapper {
          border-color: #333;
        }
        .wallet-table {
          width: 100%;
          border-collapse: collapse;
        }
        .wallet-table th, .wallet-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .wallet-table-container.dark .wallet-table th,
        .wallet-table-container.dark .wallet-table td {
          border-bottom-color: #333;
        }
        .wallet-table th {
          background-color: #f8f9fa;
        }
        .wallet-table-container.dark .wallet-table th {
          background-color: #1e1e1e;
        }
        .address-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        button {
          margin-right: 5px;
          padding: 5px 10px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        button:hover {
          opacity: 0.8;
        }
        `
      }} />
    </div>
  )
}