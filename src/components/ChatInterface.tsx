import { useState, useRef, useEffect } from 'react';
import { Send, Flag, LogOut, SkipForward, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  session_id: string;
  sender_device_id: string;
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  deviceId: string;
  matchedNickname?: string;
  onSendMessage: (content: string) => void;
  onLeave: () => void;
  onNext: () => void;
  onReport: (reason: string) => void;
}

export const ChatInterface = ({
  messages,
  deviceId,
  matchedNickname = 'Stranger',
  onSendMessage,
  onLeave,
  onNext,
  onReport,
}: ChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleReport = () => {
    if (reportReason.trim()) {
      onReport(reportReason);
      setShowReportModal(false);
      setReportReason('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-lg">🎭</span>
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">{matchedNickname}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="status-online w-2 h-2" />
              Online
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowReportModal(true)}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
          >
            <Flag className="w-4 h-4" />
          </Button>
          <Button
            onClick={onNext}
            variant="outline"
            size="sm"
          >
            <SkipForward className="w-4 h-4" />
            Next
          </Button>
          <Button
            onClick={onLeave}
            variant="ghost"
            size="sm"
            className="text-destructive"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <span className="text-4xl mb-4">👋</span>
            <p className="text-lg font-medium">You're connected!</p>
            <p className="text-sm">Say hello to start the conversation</p>
          </div>
        )}

        {messages.map((message, index) => {
          const isSent = message.sender_device_id === deviceId;
          const showTime = index === 0 || 
            new Date(message.created_at).getMinutes() !== 
            new Date(messages[index - 1].created_at).getMinutes();

          return (
            <div key={message.id}>
              {showTime && (
                <div className="text-center text-xs text-muted-foreground my-2">
                  {new Date(message.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              )}
              <div
                className={cn(
                  "flex animate-fade-in",
                  isSent ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] break-words",
                    isSent ? "chat-bubble-sent" : "chat-bubble-received"
                  )}
                >
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            maxLength={500}
          />
          <Button
            type="submit"
            variant="hero"
            size="icon"
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-sm animate-scale-in">
            <div className="flex items-center gap-3 mb-4 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-display font-semibold">Report User</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This will end the chat and report the user for review.
            </p>
            <Input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason for report..."
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setShowReportModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReport}
                variant="destructive"
                className="flex-1"
                disabled={!reportReason.trim()}
              >
                Report & Leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
