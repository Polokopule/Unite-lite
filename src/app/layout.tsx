
import type { Metadata } from 'next';
import './globals.css';
import { AppContextProvider } from '@/contexts/app-context';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Unite - Learn and Earn',
  description: 'Create and sell courses, or advertise your business.',
  icons: {
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
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AppContextProvider>
              <Header />
              <main>{children}</main>
              <Toaster />
            </AppContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
