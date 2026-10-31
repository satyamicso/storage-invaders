import { app } from './app.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

const server = app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      level: 'INFO',
      event: 'server_start',
      port: PORT,
      timestamp: new Date().toISOString(),
    })
  );
});

// Graceful SIGTERM shutdown for Cloud Run container lifecycle
const handleShutdown = (signal: string) => {
  console.log(
    JSON.stringify({
      level: 'INFO',
      event: 'server_shutdown_start',
      signal,
      timestamp: new Date().toISOString(),
    })
  );

  server.close(() => {
    console.log(
      JSON.stringify({
        level: 'INFO',
        event: 'server_shutdown_complete',
        timestamp: new Date().toISOString(),
      })
    );
    process.exit(0);
  });

  // Force exit if connections don't drain within 8s
  setTimeout(() => {
    console.error(
      JSON.stringify({
        level: 'FATAL',
        event: 'server_shutdown_forced',
        timestamp: new Date().toISOString(),
      })
    );
    process.exit(1);
  }, 8000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
