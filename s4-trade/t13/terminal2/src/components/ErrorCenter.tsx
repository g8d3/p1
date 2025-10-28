import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { errorStore } from '@/stores/errors'
import type { ErrorLog } from '@/types'
import { formatAddress } from '@/lib/utils'

export function ErrorCenter() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadErrors()
  }, [])

  const loadErrors = async () => {
    const errorLogs = await errorStore.getErrors()
    setErrors(errorLogs)
  }

  const clearErrors = async () => {
    await errorStore.clearErrors()
    setErrors([])
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(timestamp)
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        >
          Errors ({errors.length})
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Error Center</CardTitle>
          <div className="flex gap-2">
            <Button onClick={clearErrors} variant="outline" size="sm">
              Clear All
            </Button>
            <Button onClick={() => setIsOpen(false)} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          {errors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No errors logged yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Stack</TableHead>
                  <TableHead>Context</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell className="font-mono text-xs">
                      {formatTimestamp(error.timestamp)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {error.message}
                    </TableCell>
                    <TableCell className="max-w-sm">
                      <pre className="text-xs whitespace-pre-wrap font-mono max-h-20 overflow-hidden">
                        {error.stack?.split('\n').slice(0, 3).join('\n')}
                      </pre>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {error.context && (
                        <pre className="text-xs whitespace-pre-wrap font-mono max-h-20 overflow-hidden">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}