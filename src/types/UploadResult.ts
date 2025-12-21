'use client'

export interface UploadResult {
  success: boolean
  detectedMetrics?: string[]
  dateRange?: {
    start: string
    end: string
  }
  message?: string
}


