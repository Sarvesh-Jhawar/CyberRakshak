"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { api, getAuthHeaders } from "@/lib/api"

interface GmailConnectProps {
  onConnected?: () => void
}

export function GmailConnect({ onConnected }: GmailConnectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const { toast } = useToast()

  // Check Gmail connection status on mount
  useEffect(() => {
    checkGmailStatus()
  }, [])

  const checkGmailStatus = async () => {
    try {
      setIsChecking(true)
      const response = await fetch(api.gmail.status, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setIsConnected(data.data?.gmail_connected || false)
      }
    } catch (error) {
      console.error("Error checking Gmail status:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleConnectGmail = async () => {
    try {
      setIsLoading(true)

      // Get authorization URL
      const response = await fetch(api.gmail.authorize, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to get authorization URL")
      }

      const data = await response.json()
      const authUrl = data.data?.auth_url

      if (!authUrl) {
        throw new Error("No authorization URL returned")
      }

      // Redirect to Google OAuth (will redirect back to /api/v1/auth/gmail/callback)
      window.location.href = authUrl
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect Gmail. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleDisconnectGmail = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(api.gmail.disconnect, {
        method: "POST",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to disconnect Gmail")
      }

      setIsConnected(false)
      toast({
        title: "Success",
        description: "Gmail disconnected successfully",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to disconnect Gmail",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <span className="text-sm text-gray-600">Checking Gmail status...</span>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700">Gmail Connected</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDisconnectGmail}
          disabled={isLoading}
        >
          {isLoading ? "Disconnecting..." : "Disconnect Gmail"}
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleConnectGmail}
      disabled={isLoading}
      className="gap-2"
      size="lg"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {isLoading ? "Connecting..." : "Connect Gmail"}
    </Button>
  )
}
