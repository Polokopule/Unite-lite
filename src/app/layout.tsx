
import type { Metadata } from 'next';
import './globals.css';
import { AppContextProvider } from '@/contexts/app-context';
import { Header } from '@/components/header';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Unite - Learn and Earn',
  description: 'Create and sell courses, or advertise your business.',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon.png',
    icon: 'https://raw.githubusercontent.com/Polokopule/UM/c75512e1eb1db9a842359e7e8d145755832a5d62/20250929_192455.png',
  },
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
        <meta name="google-adsense-account" content="ca-pub-6024568817887379" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            <AppContextProvider>
              <Header />
              <main>{children}</main>
              <Toaster
                position="bottom-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </AppContextProvider>
        </ThemeProvider>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6024568817887379"
     crossorigin="anonymous"></script> 
      </body>
    </html>
  );
}
