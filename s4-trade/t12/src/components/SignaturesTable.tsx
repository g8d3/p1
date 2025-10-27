import React from 'react'
import { Signature } from '../types'

interface SignaturesTableProps {
  signatures: Signature[]
  onCopy: (text: string) => void
}

export const SignaturesTable: React.FC<SignaturesTableProps> = ({
  signatures,
  onCopy
}) => {
  if (signatures.length === 0) {
    return null
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Signatures Register</h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Wallet ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Input</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Output/Error</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {signatures.map(signature => (
              <tr key={signature.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  {signature.type === 'message' ? 'Message' : 'Transaction'}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd', fontFamily: 'monospace', fontSize: '12px' }}>
                  {signature.walletId}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace' }}>{signature.input}</pre>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {signature.error ? (
                    <span style={{ color: 'red', fontFamily: 'monospace', fontSize: '12px' }}>
                      Error: {signature.error}
                    </span>
                  ) : (
                    <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace' }}>{signature.output}</pre>
                  )}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  {signature.timestamp.toLocaleTimeString()}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  <button onClick={() => onCopy(signature.input)} style={{ marginRight: '5px' }}>Copy Input</button>
                  {signature.error ? (
                    <button onClick={() => onCopy(signature.error!)}>Copy Error</button>
                  ) : (
                    <button onClick={() => onCopy(signature.output)}>Copy Output</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}