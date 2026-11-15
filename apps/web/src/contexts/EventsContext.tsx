'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getAuthToken } from '@/lib/api';
import { AdminDashboardResponse, SnackListResponse } from '@/lib/types';

interface EventsContextValue {
  isConnected: boolean;
  lastEvent: string | null;
}

const EventsContext = createContext<EventsContextValue>({
  isConnected: false,
  lastEvent: null,
});

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let retryDelay = 1000;

    function connect() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '');
      const token = getAuthToken();
      const sseUrl = `${apiUrl}/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      const es = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.addEventListener('open', () => {
        if (!isMounted) return;
        setIsConnected(true);
        retryDelay = 1000; // Reset backoff on successful connect
      });

      es.addEventListener('CONNECTED', () => {
        if (!isMounted) return;
        setIsConnected(true);
        setLastEvent('CONNECTED');
      });

      // 1. Stock Updated Event (consume or restock)
      es.addEventListener('STOCK_UPDATED', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(e.data);
          setLastEvent(`STOCK_UPDATED: ${payload.snackName || payload.snackId}`);

          // A. Update Admin Dashboard cache
          queryClient.setQueryData<AdminDashboardResponse>(['admin-dashboard'], (old) => {
            if (!old) return old;

            // Update needsRestock list
            const existingNeedsIndex = old.needsRestock.findIndex((s) => s.id === payload.snackId);
            const updatedNeeds = [...old.needsRestock];

            if (payload.quantity <= payload.lowStockThreshold) {
              if (existingNeedsIndex >= 0) {
                updatedNeeds[existingNeedsIndex] = {
                  ...updatedNeeds[existingNeedsIndex],
                  quantity: payload.quantity,
                  status: payload.quantity === 0 ? 'gone' : 'low',
                };
              }
            } else {
              // Now stocked, remove from needsRestock
              if (existingNeedsIndex >= 0) {
                updatedNeeds.splice(existingNeedsIndex, 1);
              }
            }

            return {
              ...old,
              needsRestock: updatedNeeds,
            };
          });

          // B. Update Snacks catalog cache
          queryClient.setQueriesData<SnackListResponse>({ queryKey: ['snacks'] }, (old) => {
            if (!old?.data) return old;
            return {
              ...old,
              data: old.data.map((snack) =>
                snack.id === payload.snackId
                  ? {
                      ...snack,
                      quantity: payload.quantity,
                      status: payload.status,
                    }
                  : snack
              ),
            };
          });

          // C. Background refresh summary and admin-dashboard to recalculate exact counts
          queryClient.invalidateQueries({ queryKey: ['snack-summary'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard'], exact: false });
        } catch {
          // ignore parse errors
        }
      });

      // 2. Activity New Event (new consumption or restock event)
      es.addEventListener('ACTIVITY_NEW', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(e.data);
          setLastEvent(`ACTIVITY_NEW: ${payload.userName} ${payload.action}`);

          // Prepend to Admin Dashboard live activity feed immediately
          queryClient.setQueryData<AdminDashboardResponse>(['admin-dashboard'], (old) => {
            if (!old) return old;
            const newAct = {
              id: payload.id,
              userName: payload.userName,
              snackName: payload.snackName,
              action: payload.action,
              amount: payload.amount,
              createdAt: payload.createdAt,
            };

            const updatedActs = [newAct, ...old.recentActivity.filter((a) => a.id !== payload.id)].slice(0, 10);

            return {
              ...old,
              recentActivity: updatedActs,
            };
          });

          // Invalidate activity table
          queryClient.invalidateQueries({ queryKey: ['activity'], exact: false });
        } catch {
          // ignore
        }
      });

      // 3. Vote Updated Event
      es.addEventListener('VOTE_UPDATED', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(e.data);
          setLastEvent(`VOTE_UPDATED: ${payload.snackId} (${payload.voteCount})`);

          queryClient.setQueriesData<SnackListResponse>({ queryKey: ['snacks'] }, (old) => {
            if (!old?.data) return old;
            return {
              ...old,
              data: old.data.map((snack) =>
                snack.id === payload.snackId
                  ? { ...snack, voteCount: payload.voteCount }
                  : snack
              ),
            };
          });

          queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
        } catch {
          // ignore
        }
      });

      // 4. Snack Mutated Event (created, updated, archived)
      es.addEventListener('SNACK_MUTATED', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(e.data);
          setLastEvent(`SNACK_MUTATED: ${payload.action}`);
          queryClient.invalidateQueries({ queryKey: ['snacks'] });
          queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        if (!isMounted) return;
        setIsConnected(false);
        es.close();

        // Exponential backoff reconnect
        retryTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            connect();
          }
        }, retryDelay);
        retryDelay = Math.min(retryDelay * 1.5, 15000);
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [queryClient, user]);

  return (
    <EventsContext.Provider value={{ isConnected, lastEvent }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  return useContext(EventsContext);
}
