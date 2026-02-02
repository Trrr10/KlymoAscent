import { useState, useEffect } from 'react';
import { useDevice } from '@/hooks/useDevice';
import { useMatching } from '@/hooks/useMatching';
import { useChat } from '@/hooks/useChat';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { CameraVerification } from '@/components/CameraVerification';
import { ProfileSetup } from '@/components/ProfileSetup';
import { MatchingQueue } from '@/components/MatchingQueue';
import { ChatInterface } from '@/components/ChatInterface';
import { Loader2 } from 'lucide-react';

type OnboardingStep = 'welcome' | 'verification' | 'profile' | 'queue' | 'chat';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  
  const {
    device,
    profile,
    loading: deviceLoading,
    isVerified,
    hasProfile,
    canMatchSpecific,
    remainingSpecificMatches,
    updateGender,
    createProfile,
    incrementMatchCount,
  } = useDevice();

  const {
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
  } = useMatching(device?.id, device?.gender);

  const {
    messages,
    sendMessage,
    clearMessages,
  } = useChat(currentSession?.id, device?.id);

  // Determine current step based on state
  useEffect(() => {
    if (deviceLoading) return;

    if (currentSession) {
      setCurrentStep('chat');
    } else if (isSearching || isInQueue) {
      setCurrentStep('queue');
    } else if (hasProfile && isVerified) {
      setCurrentStep('queue');
    } else if (isVerified && !hasProfile) {
      setCurrentStep('profile');
    }
  }, [deviceLoading, isVerified, hasProfile, currentSession, isSearching, isInQueue]);

  // Handle step transitions
  const handleGetStarted = () => {
    if (isVerified && hasProfile) {
      setCurrentStep('queue');
    } else if (isVerified) {
      setCurrentStep('profile');
    } else {
      setCurrentStep('verification');
    }
  };

  const handleVerified = async (gender: 'male' | 'female') => {
    await updateGender(gender);
    setCurrentStep('profile');
  };

  const handleProfileComplete = async (nickname: string, bio: string) => {
    await createProfile(nickname, bio);
    setCurrentStep('queue');
  };

  const handleJoinQueue = async (preference: 'male' | 'female' | 'any') => {
    try {
      if (preference !== 'any') {
        await incrementMatchCount();
      }
      await joinQueue(preference);
    } catch (error) {
      console.error('Error joining queue:', error);
    }
  };

  const handleLeaveChat = async () => {
    await endSession();
    clearMessages();
    setCurrentStep('queue');
  };

  const handleNextMatch = async () => {
    await endSession();
    clearMessages();
    setCurrentStep('queue');
  };

  const handleReport = async (reason: string) => {
    await reportUser(reason);
    clearMessages();
    setCurrentStep('queue');
  };

  const handleLogout = async () => {
    // Clear local storage and reload
    const { clearLocalData } = await import('@/lib/fingerprint');
    clearLocalData();
    window.location.reload();
  };

  // Loading state
  if (deviceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'welcome' && (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}

      {currentStep === 'verification' && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <CameraVerification 
            onVerified={handleVerified}
            onSkip={() => {
              // For demo, allow skipping with random gender
              handleVerified(Math.random() > 0.5 ? 'male' : 'female');
            }}
          />
        </div>
      )}

      {currentStep === 'profile' && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <ProfileSetup 
            onComplete={handleProfileComplete}
            existingNickname={profile?.nickname}
            existingBio={profile?.bio || undefined}
          />
        </div>
      )}

      {currentStep === 'queue' && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <MatchingQueue
            isSearching={isSearching || isInQueue}
            queueCount={queueCount}
            remainingSpecificMatches={remainingSpecificMatches}
            nickname={profile?.nickname || 'User'}
            onJoinQueue={handleJoinQueue}
            onLeaveQueue={leaveQueue}
            onLogout={handleLogout}
            deviceGender={device?.gender || null}
          />
        </div>
      )}

      {currentStep === 'chat' && device && (
        <div className="h-screen">
          <ChatInterface
            messages={messages}
            deviceId={device.id}
            matchedNickname={matchedProfile?.nickname || 'Stranger'}
            onSendMessage={sendMessage}
            onLeave={handleLeaveChat}
            onNext={handleNextMatch}
            onReport={handleReport}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
