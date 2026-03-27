"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/src/utils/supabase/client";
import { useAuth } from "@/src/providers/AuthProvider";

export function useDashboardSummary() {
  const { user, isLoading: authLoading } = useAuth();
  const [transactionCount, setTransactionCount] = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      return;
    }
    setDataLoading(true);
    try {

      // 1. Get transactions count
      // RLS handles filtering, we stick to a simple count of what's visible
      const { count: txCount, error: txError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      if (txError) throw txError;
      setTransactionCount(txCount || 0);

      // 2. Get activities count
      const { count: actCount, error: actError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', 'activity');

      if (actError) throw actError;
      setActivityCount(actCount || 0);

    } catch (err) {
      console.error("[DASHBOARD/SUMMARY] Fetch error:", err);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    // Subscribe to both tables for realtime orchestration
    const txChannel = supabase
      .channel('dashboard-tx-summary')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .subscribe();

    const notifChannel = supabase
      .channel('dashboard-notif-summary')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [fetchData, user]);

  return {
    transactionCount,
    activityCount,
    isDashboardEmpty: transactionCount === 0 && activityCount === 0,
    isActivityEmpty: activityCount === 0,
    isLoading: authLoading || (user && dataLoading),
    refetch: fetchData
  };
}
