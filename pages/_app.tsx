import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import '@/styles/globals.css';
import Layout from '@/components/Layout';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  // Initialize cron jobs and automation system on app load
  useEffect(() => {
    const initializeAutomation = async () => {
      try {
        await fetch('/api/system/init', { method: 'POST' });
      } catch (error) {
        console.warn('Could not initialize automation system:', error);
      }
    };

    initializeAutomation();
  }, []);

  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}
