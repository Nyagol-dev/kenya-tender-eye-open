import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreference {
  notify_email: boolean;
  notify_sectors: string[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  tender_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => api.get<{ unread: number }>('/notifications/count'),
    enabled: !!user,
    refetchInterval: 60000,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<AppNotification[]>('/notifications'),
    enabled: !!user,
  });

  const { data: preferencesData } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => api.get<NotificationPreference>('/notifications/preferences'),
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (prefs: NotificationPreference) => api.put('/notifications/preferences', prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    },
  });

  return {
    count: countData?.unread || 0,
    notifications: notificationsData || [],
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
    preferences: preferencesData,
    updatePreferences: (prefs: NotificationPreference) => updatePreferencesMutation.mutate(prefs),
  };
};
