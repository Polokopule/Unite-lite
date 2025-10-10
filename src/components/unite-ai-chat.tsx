'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Bot, Loader2, Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { uniteAIFlow } from '@/ai/flows/unite-ai-flow';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAppContext } from '@/contexts/app-context';
import { ScrollArea } from './ui/scroll-area';
import { Logo } from './logo';

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

export function UniteAIChat() {
  const { user } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHistory([
        {
          role: 'model',
          text: `Hello! I'm Unite AI. How can I help you understand the Unite platform today?`,
        },
      ]);
      setQuestion('');
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to the bottom when history changes
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [history]);

  const handleSend = async () => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: question };
    setHistory((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const genkitHistory = history.map((msg) => ({
        role: msg.role,
        content: [{ text: msg.text }],
      }));

      const response = await uniteAIFlow({
        history: genkitHistory,
        question: question,
      });

      const modelMessage: ChatMessage = { role: 'model', text: response };
      setHistory((prev) => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'model',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-7 w-7" />
        <span className="sr-only">Open AI Chat</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md flex flex-col h-[70vh] max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Logo />
              <span>AI Assistant</span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {history.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'model' && (
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                      <AvatarFallback>
                        <Bot size={20} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xs rounded-lg p-3 text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.role === 'user' && user && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL} alt={user.name} />
                      <AvatarFallback>
                        {user.name?.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                      <AvatarFallback>
                        <Bot size={20} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-xs rounded-lg p-3 text-sm bg-muted flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <div className="flex w-full items-center gap-2">
              <Input
                placeholder="Ask a question about Unite..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !question.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
