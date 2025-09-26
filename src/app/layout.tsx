import type { Metadata } from 'next';
import './globals.css';
import { AppContextProvider } from '@/contexts/app-context';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'AdEd - Learn and Earn',
  description: 'Create and sell courses, or advertise your business.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AppContextProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Toaster />
        </AppContextProvider>
      </body>
    </html>
  );
}
