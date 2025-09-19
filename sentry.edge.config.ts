import * as Sentry from '@sentry/nextjs';

// Só inicializa o Sentry se o DSN estiver configurado
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
  
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
  });
}
