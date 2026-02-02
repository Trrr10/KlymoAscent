import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  session_id: string;
  sender_device_id: string;
  content: string;
  created_at: string;
}

export const useChat = (sessionId: string | undefined, deviceId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load existing messages
  const loadMessages = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data as Message[]);
  }, [sessionId]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId || !deviceId || !content.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        sender_device_id: deviceId,
        content: content.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [sessionId, deviceId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!sessionId) return;

    loadMessages();

    channelRef.current = supabase
      .channel(`chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.find((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, loadMessages]);

  // Clear messages when session ends
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
  };
};
