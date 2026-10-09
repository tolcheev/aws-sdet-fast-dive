import { logError, logInfo } from '../logging/logger.js';
import { runWorkerOnce } from './runWorkerOnce.js';

async function main(): Promise<void> {
  logInfo('worker.started');

  while (true) {
    try {
      await runWorkerOnce();
    } catch (error) {
      logError('worker.loop_failed', error);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logError('worker.fatal', error);
    process.exitCode = 1;
  });
}
