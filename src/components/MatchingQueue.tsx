import { useState } from 'react';
import { Search, Users, Zap, X, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchingQueueProps {
  isSearching: boolean;
  queueCount: number;
  remainingSpecificMatches: number;
  nickname: string;
  onJoinQueue: (preference: 'male' | 'female' | 'any') => void;
  onLeaveQueue: () => void;
  onLogout: () => void;
  deviceGender: 'male' | 'female' | null;
}

export const MatchingQueue = ({
  isSearching,
  queueCount,
  remainingSpecificMatches,
  nickname,
  onJoinQueue,
  onLeaveQueue,
  onLogout,
  deviceGender,
}: MatchingQueueProps) => {
  const [selectedPreference, setSelectedPreference] = useState<'male' | 'female' | 'any' | null>(null);

  const handleSearch = (preference: 'male' | 'female' | 'any') => {
    if (preference !== 'any' && remainingSpecificMatches <= 0) {
      return;
    }
    setSelectedPreference(preference);
    onJoinQueue(preference);
  };

  if (isSearching) {
    return (
      <div className="glass-card p-8 w-full max-w-md mx-auto animate-fade-in text-center">
        {/* Searching Animation */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 pulse-glow" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-r from-primary to-secondary opacity-40 pulse-glow" style={{ animationDelay: '0.3s' }} />
          <div className="absolute inset-8 rounded-full bg-gradient-to-r from-primary to-secondary opacity-60 pulse-glow" style={{ animationDelay: '0.6s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-10 h-10 text-primary animate-bounce-subtle" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold mb-2">
          Finding Your Match...
        </h2>
        <p className="text-muted-foreground mb-6">
          {queueCount > 1 
            ? `${queueCount} people are searching right now`
            : 'Looking for someone to chat with...'}
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <div className="status-searching" />
          <span>Searching for: {selectedPreference === 'any' ? 'Anyone' : selectedPreference}</span>
        </div>

        <Button
          onClick={onLeaveQueue}
          variant="outline"
          size="lg"
          className="w-full"
        >
          <X className="w-4 h-4" />
          Cancel Search
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 w-full max-w-md mx-auto animate-fade-in">
      {/* Profile Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{nickname}</p>
            <p className="text-xs text-muted-foreground">Your profile</p>
          </div>
        </div>
        <Button
          onClick={onLogout}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </Button>
      </div>

      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center float-animation">
          <Users className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-display font-bold gradient-text mb-2">
          Ready to Chat?
        </h2>
        <p className="text-muted-foreground text-sm">
          Choose who you want to match with
        </p>
      </div>

      {/* Online Count */}
      <div className="flex items-center justify-center gap-2 mb-6 text-sm">
        <div className="status-online" />
        <span className="text-muted-foreground">
          {queueCount} {queueCount === 1 ? 'person' : 'people'} online
        </span>
      </div>

      {/* Preference Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => handleSearch('male')}
          disabled={remainingSpecificMatches <= 0}
          className={cn(
            "p-4 rounded-xl border-2 transition-all duration-200",
            "hover:border-primary/50 hover:bg-muted/50",
            remainingSpecificMatches <= 0 
              ? "opacity-50 cursor-not-allowed border-border"
              : "border-border cursor-pointer"
          )}
        >
          <span className="text-2xl mb-2 block">👨</span>
          <span className="text-sm font-medium">Male</span>
        </button>

        <button
          onClick={() => handleSearch('female')}
          disabled={remainingSpecificMatches <= 0}
          className={cn(
            "p-4 rounded-xl border-2 transition-all duration-200",
            "hover:border-primary/50 hover:bg-muted/50",
            remainingSpecificMatches <= 0 
              ? "opacity-50 cursor-not-allowed border-border"
              : "border-border cursor-pointer"
          )}
        >
          <span className="text-2xl mb-2 block">👩</span>
          <span className="text-sm font-medium">Female</span>
        </button>

        <button
          onClick={() => handleSearch('any')}
          className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 transition-all duration-200 hover:border-primary hover:bg-primary/10 cursor-pointer"
        >
          <span className="text-2xl mb-2 block">✨</span>
          <span className="text-sm font-medium text-primary">Anyone</span>
        </button>
      </div>

      {/* Quick Match Button */}
      <Button
        onClick={() => handleSearch('any')}
        variant="hero"
        size="xl"
        className="w-full"
      >
        <Zap className="w-5 h-5" />
        Quick Match
      </Button>

      {/* Usage Limits */}
      <div className="mt-6 p-3 rounded-lg bg-muted/50 text-center">
        <p className="text-xs text-muted-foreground">
          {remainingSpecificMatches > 0 ? (
            <>
              <span className="text-warning font-semibold">{remainingSpecificMatches}</span>
              {' '}specific gender matches remaining today
            </>
          ) : (
            <>
              <span className="text-destructive">No specific matches left today.</span>
              {' '}Use "Anyone" for unlimited matching!
            </>
          )}
        </p>
      </div>
    </div>
  );
};
