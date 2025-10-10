
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
import { useRouter } from 'next/navigation';
import { AIChatMessage } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

export default function AiChatPage() {
  const { user, updateAIChatHistory } = useAppContext();
  const router = useRouter();
  const [history, setHistory] = useState<AIChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.aiChatHistory && user.aiChatHistory.length > 0) {
      setHistory(user.aiChatHistory);
    } else {
      setHistory([
        {
          role: 'model',
          parts: [{ text: `Hello! I'm Unite AI. How can I help you understand the Unite platform today?`}],
        },
      ]);
    }
  }, [user]);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSend = async () => {
    if (!question.trim()) return;

    const userMessage: AIChatMessage = { role: 'user', parts: [{ text: question }] };
    const newHistory = [...history, userMessage];
    setHistory(newHistory);
    setQuestion('');
    setIsLoading(true);

    try {
      const response = await uniteAIFlow({
        history: newHistory,
        question: question,
      });
      
      const modelMessage: AIChatMessage = { role: 'model', parts: [{ text: response }] };
      const finalHistory = [...newHistory, modelMessage];
      setHistory(finalHistory);
      await updateAIChatHistory(finalHistory);

    } catch (error) {
      console.error("AI flow error:", error);
      const errorMessage: AIChatMessage = {
        role: 'model',
        parts: [{ text: 'Sorry, I encountered an error. Please try again.' }],
      };
      const finalHistory = [...newHistory, errorMessage];
      setHistory(finalHistory);
      await updateAIChatHistory(finalHistory);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getMessageText = (msg: AIChatMessage) => {
    if (!msg || !msg.parts || !Array.isArray(msg.parts)) {
        return '';
    }
    return msg.parts.map(p => p.text).join('');
  }

  return (
    <div className="flex flex-col h-screen">
        <header className="relative z-[10000] flex-shrink-0 flex items-center justify-between border-b p-4 bg-background">
            <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <h2 className="font-semibold">AI Assistant</h2>
            </div>
        </div>
        </header>
        <ScrollArea className="flex-1 bg-muted/20" viewportRef={scrollViewportRef}>
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
                {getMessageText(message)}
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
        <footer className="flex-shrink-0 border-t p-4 bg-background">
        <div className="flex w-full items-center gap-2">
            <Textarea
            placeholder="Ask a question about Unite..."
            value={question}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
                }
            }}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            rows={1}
            className="max-h-24 resize-none"
            />
            <Button onClick={handleSend} disabled={isLoading || !question.trim()}>
            <Send className="h-4 w-4" />
            </Button>
        </div>
        </footer>
    </div>
  );
}

    

    