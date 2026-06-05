import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

/**
 * Custom React hook for polling the payment status of a bid application.
 *
 * Logic:
 * - Polls GET /api/bid-applications/:applicationId every 5000ms when enabled=true.
 * - Uses the existing api helper from src/lib/api.ts.
 * - Stops polling when status is 'payment_confirmed', 'rejected', or enabled=false.
 * - Cleans up interval on unmount.
 * - Exposes refetch() for manual triggers.
 *
 * @param applicationId - The ID of the bid application to poll, or null.
 * @param enabled - Whether polling is active.
 * @returns The application status, loading state, error state, and a manual refetch function.
 */
export function useBidApplicationPolling(
  applicationId: string | null,
  enabled: boolean
) {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track latest props and state to avoid restarting the interval unnecessarily
  const statusRef = useRef<string | null>(null);
  const enabledRef = useRef<boolean>(enabled);
  const applicationIdRef = useRef<string | null>(applicationId);

  // Sync refs with state/props
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    applicationIdRef.current = applicationId;
  }, [applicationId]);

  /**
   * Fetches the bid application status.
   *
   * @param showLoading - Whether to set the isLoading state during the fetch.
   */
  const fetchStatus = useCallback(async (showLoading = false) => {
    const appId = applicationIdRef.current;
    if (!appId) return null;

    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await api.get<{ status: string }>(`/bid-applications/${appId}`);
      setStatus(data.status);
      return data.status;
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch bid application status');
      return null;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  // Reset state whenever applicationId changes
  useEffect(() => {
    setStatus(null);
    setError(null);
    setIsLoading(false);
  }, [applicationId]);

  // Main polling effect
  useEffect(() => {
    if (!enabled || !applicationId) {
      return;
    }

    // Stop polling if we've already reached a terminal state
    if (status === 'payment_confirmed' || status === 'rejected') {
      return;
    }

    // Perform initial fetch immediately if status is not loaded yet
    if (status === null) {
      fetchStatus(true);
    }

    const intervalId = setInterval(async () => {
      // Check latest conditions before fetching
      if (!enabledRef.current || !applicationIdRef.current) {
        clearInterval(intervalId);
        return;
      }

      const currentStatus = statusRef.current;
      if (currentStatus === 'payment_confirmed' || currentStatus === 'rejected') {
        clearInterval(intervalId);
        return;
      }

      const newStatus = await fetchStatus(false);
      if (newStatus === 'payment_confirmed' || newStatus === 'rejected') {
        clearInterval(intervalId);
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [applicationId, enabled, status, fetchStatus]);

  // Manual refetch function
  const refetch = useCallback(() => {
    if (applicationIdRef.current) {
      fetchStatus(true);
    }
  }, [fetchStatus]);

  return {
    status,
    isLoading,
    error,
    refetch,
  };
}
