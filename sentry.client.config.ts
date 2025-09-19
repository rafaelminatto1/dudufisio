import * as Sentry from '@sentry/nextjs';

// Só inicializa o Sentry se o DSN estiver configurado
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
  
  // Integrations
  integrations: [
    // Replay integration is not available in @sentry/nextjs
    // Use @sentry/replay if needed
  ],
  
  // Before send hook to filter sensitive data
  beforeSend(event) {
    // Remove sensitive data from events
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    // Filter out health check requests
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }
    
    return event;
  },
  
  // Filter out non-error events in production
  beforeSendTransaction(event) {
    // Only send transactions for errors in production
    if (process.env.NODE_ENV === 'production' && event.transaction) {
      return null;
    }
    return event;
  },
  });
}
