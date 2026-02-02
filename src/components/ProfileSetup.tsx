import { useState } from 'react';
import { User, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ProfileSetupProps {
  onComplete: (nickname: string, bio: string) => void;
  existingNickname?: string;
  existingBio?: string;
}

export const ProfileSetup = ({ onComplete, existingNickname, existingBio }: ProfileSetupProps) => {
  const [nickname, setNickname] = useState(existingNickname || '');
  const [bio, setBio] = useState(existingBio || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError('Nickname must be 2-20 characters');
      return;
    }

    if (bio.length > 100) {
      setError('Bio must be under 100 characters');
      return;
    }

    onComplete(nickname.trim(), bio.trim());
  };

  return (
    <div className="glass-card p-6 w-full max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <User className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-display font-bold gradient-text mb-2">
          Create Your Profile
        </h2>
        <p className="text-muted-foreground text-sm">
          Choose a temporary nickname. No personal information required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nickname
          </label>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter a cool nickname..."
            maxLength={20}
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {nickname.length}/20
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Short Bio <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a bit about yourself..."
            maxLength={100}
            className="min-h-[80px]"
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {bio.length}/100
          </p>
        </div>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full mt-6"
        >
          <Sparkles className="w-4 h-4" />
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <p className="mt-6 text-xs text-center text-muted-foreground">
        🎭 Your profile is temporary and anonymous. No photos are displayed in chat.
      </p>
    </div>
  );
};
