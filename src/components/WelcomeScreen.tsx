import { Shield, MessageCircle, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen = ({ onGetStarted }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

      <div className="relative z-10 max-w-lg text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/30 float-animation">
            <MessageCircle className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-display font-bold gradient-text mb-4">
            Veilchat
          </h1>
          <p className="text-xl text-muted-foreground">
            Anonymous conversations with controlled safety
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card p-4 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Privacy First</p>
            <p className="text-xs text-muted-foreground mt-1">No PII required</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-secondary" />
            <p className="text-sm font-medium">Verified Users</p>
            <p className="text-xs text-muted-foreground mt-1">AI verification</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-warning" />
            <p className="text-sm font-medium">Instant Match</p>
            <p className="text-xs text-muted-foreground mt-1">Real-time queue</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button
            onClick={onGetStarted}
            variant="hero"
            size="xl"
            className="w-full max-w-xs mx-auto"
          >
            <Zap className="w-5 h-5" />
            Get Started
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            No email or phone number needed
          </p>
        </div>
      </div>

      {/* Privacy Badge */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <Shield className="w-4 h-4 text-primary" />
        Your privacy is our priority
      </div>
    </div>
  );
};
