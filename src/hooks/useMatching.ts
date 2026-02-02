import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface QueueEntry {
  id: string;
  device_id: string;
  preferred_gender: 'male' | 'female' | 'any';
  joined_at: string;
}

interface ChatSession {
  id: string;
  device_a: string;
  device_b: string;
  started_at: string;
  ended_at: string | null;
}

interface MatchedProfile {
  nickname: string;
  bio: string | null;
}

export const useMatching = (deviceId: string | undefined, deviceGender: string | null | undefined) => {
  const [isInQueue, setIsInQueue] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [matchedDeviceId, setMatchedDeviceId] = useState<string | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<MatchedProfile | null>(null);
  const [queueCount, setQueueCount] = useState(0);

  const fetchMatchedProfile = useCallback(async (matchDeviceId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('nickname, bio')
      .eq('device_id', matchDeviceId)
      .single();
    
    if (data) {
      setMatchedProfile(data as MatchedProfile);
    }
  }, []);

  // Join the matching queue
  const joinQueue = useCallback(async (preferredGender: 'male' | 'female' | 'any') => {
    if (!deviceId) return;

    setIsSearching(true);

    try {
      // First, check cooldown
      const { data: cooldown } = await supabase
        .from('cooldowns')
        .select('*')
        .eq('device_id', deviceId)
        .gt('cooldown_until', new Date().toISOString())
        .single();

      if (cooldown) {
        throw new Error('Please wait before searching again');
      }

      // Remove from queue if already there
      await supabase
        .from('matching_queue')
        .delete()
        .eq('device_id', deviceId);

      // Add to queue
      const { error: insertError } = await supabase
        .from('matching_queue')
        .insert({
          device_id: deviceId,
          preferred_gender: preferredGender,
        });

      if (insertError) throw insertError;

      setIsInQueue(true);

      // Try to find a match
      await attemptMatch(preferredGender);
    } catch (error) {
      console.error('Error joining queue:', error);
      setIsSearching(false);
      throw error;
    }
  }, [deviceId, deviceGender]);

  // Attempt to find a match
  const attemptMatch = useCallback(async (preferredGender: 'male' | 'female' | 'any') => {
    if (!deviceId || !deviceGender) return;

    // Find compatible users in queue
    let query = supabase
      .from('matching_queue')
      .select(`
        *,
        devices!inner(id, gender)
      `)
      .neq('device_id', deviceId);

    // Filter by our preference
    if (preferredGender !== 'any') {
      query = query.eq('devices.gender', preferredGender);
    }

    const { data: candidates } = await query;

    if (!candidates || candidates.length === 0) {
      // No matches yet, stay in queue
      return;
    }

    // Find someone who also matches our criteria
    for (const candidate of candidates) {
      const candidatePreference = candidate.preferred_gender;
      
      // Check if candidate would accept us
      if (candidatePreference === 'any' || candidatePreference === deviceGender) {
        // We have a match!
        await createSession(deviceId, candidate.device_id);
        return;
      }
    }
  }, [deviceId, deviceGender]);

  // Create a chat session
  const createSession = async (deviceA: string, deviceB: string) => {
    // Remove both from queue
    await supabase
      .from('matching_queue')
      .delete()
      .in('device_id', [deviceA, deviceB]);

    // Create session
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        device_a: deviceA,
        device_b: deviceB,
      })
      .select()
      .single();

    if (error) throw error;

    const matchId = deviceA === deviceId ? deviceB : deviceA;
    setCurrentSession(session as ChatSession);
    setMatchedDeviceId(matchId);
    await fetchMatchedProfile(matchId);
    setIsInQueue(false);
    setIsSearching(false);
  };

  // Leave the queue
  const leaveQueue = useCallback(async () => {
    if (!deviceId) return;

    await supabase
      .from('matching_queue')
      .delete()
      .eq('device_id', deviceId);

    setIsInQueue(false);
    setIsSearching(false);
  }, [deviceId]);

  // End current session
  const endSession = useCallback(async () => {
    if (!currentSession || !deviceId) return;

    await supabase
      .from('chat_sessions')
      .update({
        ended_at: new Date().toISOString(),
        ended_by: deviceId,
      })
      .eq('id', currentSession.id);

    // Add cooldown
    await supabase
      .from('cooldowns')
      .insert({
        device_id: deviceId,
        cooldown_until: new Date(Date.now() + 5000).toISOString(), // 5 second cooldown
      });

    setCurrentSession(null);
    setMatchedDeviceId(null);
    setMatchedProfile(null);
  }, [currentSession, deviceId]);

  // Report user
  const reportUser = useCallback(async (reason: string) => {
    if (!currentSession || !deviceId || !matchedDeviceId) return;

    await supabase
      .from('reports')
      .insert({
        reporter_device_id: deviceId,
        reported_device_id: matchedDeviceId,
        session_id: currentSession.id,
        reason,
      });

    await endSession();
  }, [currentSession, deviceId, matchedDeviceId, endSession]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!deviceId) return;

    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Check for existing active session
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`device_a.eq.${deviceId},device_b.eq.${deviceId}`)
        .is('ended_at', null)
        .single();

      if (existingSession) {
        const matchId = existingSession.device_a === deviceId 
          ? existingSession.device_b 
          : existingSession.device_a;
        setCurrentSession(existingSession as ChatSession);
        setMatchedDeviceId(matchId);
        await fetchMatchedProfile(matchId);
      }

      // Get queue count
      const { count } = await supabase
        .from('matching_queue')
        .select('*', { count: 'exact', head: true });
      
      setQueueCount(count || 0);

      // Subscribe to queue changes
      channel = supabase
        .channel('matching-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matching_queue',
          },
          async (payload) => {
            // Update queue count
            const { count } = await supabase
              .from('matching_queue')
              .select('*', { count: 'exact', head: true });
            
            setQueueCount(count || 0);

            // If we're in queue and someone new joined, try to match
            if (isInQueue && payload.eventType === 'INSERT') {
              const { data: myEntry } = await supabase
                .from('matching_queue')
                .select('preferred_gender')
                .eq('device_id', deviceId)
                .single();

              if (myEntry) {
                attemptMatch(myEntry.preferred_gender as 'male' | 'female' | 'any');
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_sessions',
          },
          async (payload) => {
            const session = payload.new as ChatSession;
            if (session.device_a === deviceId || session.device_b === deviceId) {
              const matchId = session.device_a === deviceId ? session.device_b : session.device_a;
              setCurrentSession(session);
              setMatchedDeviceId(matchId);
              await fetchMatchedProfile(matchId);
              setIsInQueue(false);
              setIsSearching(false);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_sessions',
          },
          (payload) => {
            const session = payload.new as ChatSession;
            if (currentSession?.id === session.id && session.ended_at) {
              setCurrentSession(null);
              setMatchedDeviceId(null);
              setMatchedProfile(null);
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [deviceId, isInQueue, attemptMatch, currentSession?.id, fetchMatchedProfile]);

  return {
    isInQueue,
    isSearching,
    currentSession,
    matchedDeviceId,
    matchedProfile,
    queueCount,
    joinQueue,
    leaveQueue,
    endSession,
    reportUser,
  };
};
