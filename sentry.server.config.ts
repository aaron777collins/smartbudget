import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // This option will set the transaction name to the current route
  integrations: [
    Sentry.httpIntegration(),
    Sentry.prismaIntegration(),
  ],

  // Set environment
  environment: process.env.NODE_ENV || 'development',

  // Filter sensitive data
  beforeSend(event, hint) {
    // Don't send events if Sentry is not configured
    if (!process.env.SENTRY_DSN) {
      return null;
    }

    // Filter out any sensitive data from the event
    if (event.request) {
      delete event.request.cookies;

      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }
    }

    // Remove sensitive query parameters
    if (event.request?.query_string && typeof event.request.query_string === 'string') {
      const sensitiveParams = ['token', 'password', 'secret', 'api_key'];
      let queryString = event.request.query_string;

      sensitiveParams.forEach(param => {
        const regex = new RegExp(`${param}=[^&]*`, 'gi');
        queryString = queryString.replace(regex, `${param}=[REDACTED]`);
      });

      event.request.query_string = queryString;
    }

    return event;
  },
});
