import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  generateFingerprint, 
  getStoredFingerprint, 
  storeFingerprint,
  getStoredDeviceId,
  storeDeviceId
} from '@/lib/fingerprint';

interface Device {
  id: string;
  fingerprint: string;
  gender: 'male' | 'female' | null;
  verified_at: string | null;
  daily_specific_matches: number;
  last_match_reset: string;
}

interface Profile {
  id: string;
  device_id: string;
  nickname: string;
  bio: string | null;
}

export const useDevice = () => {
  const [device, setDevice] = useState<Device | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeDevice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for existing device
      const storedDeviceId = getStoredDeviceId();
      const storedFingerprint = getStoredFingerprint();

      if (storedDeviceId) {
        // Fetch existing device
        const { data: existingDevice, error: fetchError } = await supabase
          .from('devices')
          .select('*')
          .eq('id', storedDeviceId)
          .single();

        if (fetchError || !existingDevice) {
          // Device not found, create new one
          const fingerprint = storedFingerprint || await generateFingerprint();
          storeFingerprint(fingerprint);
          
          const { data: newDevice, error: createError } = await supabase
            .from('devices')
            .insert({ fingerprint })
            .select()
            .single();

          if (createError) throw createError;
          
          storeDeviceId(newDevice.id);
          setDevice(newDevice as Device);
        } else {
          setDevice(existingDevice as Device);
          
          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('device_id', storedDeviceId)
            .single();

          if (profileData) {
            setProfile(profileData as Profile);
          }
        }
      } else {
        // Generate new fingerprint and create device
        const fingerprint = await generateFingerprint();
        storeFingerprint(fingerprint);

        // Check if device with this fingerprint exists
        const { data: existingDevice } = await supabase
          .from('devices')
          .select('*')
          .eq('fingerprint', fingerprint)
          .single();

        if (existingDevice) {
          storeDeviceId(existingDevice.id);
          setDevice(existingDevice as Device);

          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('device_id', existingDevice.id)
            .single();

          if (profileData) {
            setProfile(profileData as Profile);
          }
        } else {
          // Create new device
          const { data: newDevice, error: createError } = await supabase
            .from('devices')
            .insert({ fingerprint })
            .select()
            .single();

          if (createError) throw createError;
          
          storeDeviceId(newDevice.id);
          setDevice(newDevice as Device);
        }
      }
    } catch (err) {
      console.error('Error initializing device:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize device');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateGender = async (gender: 'male' | 'female') => {
    if (!device) return;

    const { data, error: updateError } = await supabase
      .from('devices')
      .update({ gender, verified_at: new Date().toISOString() })
      .eq('id', device.id)
      .select()
      .single();

    if (updateError) throw updateError;
    setDevice(data as Device);
  };

  const createProfile = async (nickname: string, bio: string) => {
    if (!device) return;

    const { data, error: createError } = await supabase
      .from('profiles')
      .insert({ device_id: device.id, nickname, bio })
      .select()
      .single();

    if (createError) throw createError;
    setProfile(data as Profile);
    return data;
  };

  const updateProfile = async (nickname: string, bio: string) => {
    if (!device || !profile) return;

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ nickname, bio })
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) throw updateError;
    setProfile(data as Profile);
    return data;
  };

  const incrementMatchCount = async () => {
    if (!device) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Reset if new day
    if (device.last_match_reset !== today) {
      const { data } = await supabase
        .from('devices')
        .update({ daily_specific_matches: 1, last_match_reset: today })
        .eq('id', device.id)
        .select()
        .single();
      
      if (data) setDevice(data as Device);
    } else {
      const { data } = await supabase
        .from('devices')
        .update({ daily_specific_matches: device.daily_specific_matches + 1 })
        .eq('id', device.id)
        .select()
        .single();
      
      if (data) setDevice(data as Device);
    }
  };

  useEffect(() => {
    initializeDevice();
  }, [initializeDevice]);

  const isVerified = device?.verified_at !== null;
  const hasProfile = profile !== null;
  const canMatchSpecific = (device?.daily_specific_matches || 0) < 5;
  const remainingSpecificMatches = 5 - (device?.daily_specific_matches || 0);

  return {
    device,
    profile,
    loading,
    error,
    isVerified,
    hasProfile,
    canMatchSpecific,
    remainingSpecificMatches,
    updateGender,
    createProfile,
    updateProfile,
    incrementMatchCount,
    refreshDevice: initializeDevice,
  };
};
