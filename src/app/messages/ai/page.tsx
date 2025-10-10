
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Send, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { uniteAIFlow } from '@/ai/flows/unite-ai-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppContext } from '@/contexts/app-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

export default function AiChatPage() {
  const { user } = useAppContext();
  const router = useRouter();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory([
      {
        role: 'model',
        text: `Hello! I'm Unite AI. How can I help you understand the Unite platform today?`,
      },
    ]);
    setQuestion('');
  }, []);

  useEffect(() => {
    // Scroll to the bottom when history changes
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [history, isLoading]);

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
      console.error("AI flow error:", error);
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
    <div className="fixed inset-0 bg-background z-50 h-[100vh] sm:h-[100vh]">
        <Card className="flex flex-col h-full border-0 sm:border rounded-none sm:rounded-lg">
          <CardHeader className="flex-row items-center justify-between border-b p-4">
             <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                    <CardTitle>AI Assistant</CardTitle>
                </div>
            </div>
          </CardHeader>
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
          <CardFooter className="border-t p-4">
            <div className="flex w-full items-center gap-2">
              <Input
                placeholder="Ask a question about Unite..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !question.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
    </div>
  );
}
