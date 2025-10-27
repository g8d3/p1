import React from 'react'
import { Notification } from '../types'

interface NotificationTableProps {
  notifications: Notification[]
  onRemove: (id: string) => void
  onCopy?: (text: string) => void
}

export const NotificationTable: React.FC<NotificationTableProps> = ({
  notifications,
  onRemove,
  onCopy
}) => {
  if (notifications.length === 0) {
    return null
  }

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '#28a745'
      case 'error': return '#dc3545'
      case 'warning': return '#ffc107'
      case 'info': return '#17a2b8'
      default: return '#6c757d'
    }
  }

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✓'
      case 'error': return '✕'
      case 'warning': return '⚠'
      case 'info': return 'ℹ'
      default: return '•'
    }
  }

  return (
    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
      <h3>Notifications</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              padding: '12px',
              borderBottom: '1px solid #eee',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <div
              style={{
                color: getTypeColor(notification.type),
                fontSize: '18px',
                fontWeight: 'bold',
                flexShrink: 0
              }}
            >
              {getTypeIcon(notification.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {notification.title}
              </div>
              <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.4' }}>
                {notification.message}
              </div>
              <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
              {onCopy && (
                <button
                  onClick={() => onCopy(notification.message)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              )}
              <button
                onClick={() => onRemove(notification.id)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      {notifications.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button
            onClick={() => notifications.forEach(n => onRemove(n.id))}
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}