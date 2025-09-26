'use client'

import { useState } from 'react'

export default function TestAPIPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testAPI = async (endpoint: string) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      const data = await response.json()
      
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          statusText: response.statusText,
          data: data,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }))
    }
    setLoading(false)
  }

  const testEndpoints = [
    '/api/dashboard',
    '/api/daily-update/today',
    '/api/usage-status',
    '/api/beta/status'
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Test Page</h1>
        
        <div className="space-y-4 mb-8">
          {testEndpoints.map(endpoint => (
            <div key={endpoint} className="flex items-center space-x-4">
              <button
                onClick={() => testAPI(endpoint)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Test {endpoint}
              </button>
              <span className="text-sm text-gray-600">{endpoint}</span>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {Object.entries(results).map(([endpoint, result]) => (
            <div key={endpoint} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{endpoint}</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    result.status === 200 ? 'bg-green-100 text-green-800' :
                    result.status === 404 ? 'bg-red-100 text-red-800' :
                    result.status === 401 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.status || 'Error'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Time:</span> {result.timestamp}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Response:</span>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
