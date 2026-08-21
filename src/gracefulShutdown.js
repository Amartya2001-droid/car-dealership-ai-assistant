const createShutdownHandler = ({ server, logger = console, timeoutMs = 10000, exit = process.exit }) => {
  let shuttingDown = false;

  return (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.log(`Received ${signal}, closing server connections...`);

    const forceExitTimer = setTimeout(() => {
      logger.error(`Graceful shutdown did not finish within ${timeoutMs}ms, forcing exit.`);
      exit(1);
    }, timeoutMs);
    forceExitTimer.unref?.();

    server.close((err) => {
      clearTimeout(forceExitTimer);

      if (err) {
        logger.error('Error while closing the server:', err);
        return exit(1);
      }

      logger.log('Server closed cleanly.');
      return exit(0);
    });
  };
};

// Lets an orchestrator (Docker, Render, Fly, k8s) send SIGTERM before a
// redeploy/restart without dropping in-flight requests.
const registerGracefulShutdown = ({ server, signals = ['SIGTERM', 'SIGINT'], ...options }) => {
  const handler = createShutdownHandler({ server, ...options });
  signals.forEach((signal) => process.on(signal, () => handler(signal)));
  return handler;
};

module.exports = {
  createShutdownHandler,
  registerGracefulShutdown
};
