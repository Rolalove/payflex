import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/src/utils/supabase/client";
import { useAuth } from "@/src/providers/AuthProvider";

export type NotificationType = 'payment' | 'invite' | 'success' | 'alert' | 'system';
export type NotificationCategory = 'activity' | 'alert';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(category?: NotificationCategory) {
  const { user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      setDataLoading(true);

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        // PGRST205: Missing table in schema cache — handle gracefully
        if (error.code === 'PGRST205') {
          console.warn('[NOTIFICATIONS] Table missing. Please run the migration for public.notifications.');
          setNotifications([]);
          return;
        }
        throw error;
      }
      setNotifications(data || []);
      
      const unread = (data || []).filter(n => !n.is_read && n.category === 'alert').length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('[NOTIFICATIONS] Fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  }, [category, user]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      // Optionally re-fetch unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NOTIFICATIONS] Mark as read error:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NOTIFICATIONS] Mark all as read error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          // Only add if it belongs to this category or no category requested
          if (!category || newNotif.category === category) {
            setNotifications(prev => [newNotif, ...prev]);
            if (!newNotif.is_read && newNotif.category === 'alert') {
                setUnreadCount(c => c + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, category]);

  return {
    notifications,
    unreadCount,
    isLoading: authLoading || (user && dataLoading),
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}
