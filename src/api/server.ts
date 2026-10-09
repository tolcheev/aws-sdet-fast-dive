import { createApp } from './app.js';
import { getConfig } from '../config.js';
import { logInfo } from '../logging/logger.js';

const config = getConfig();
const app = createApp();

app.listen(config.port, () => {
  logInfo('api.started', {
    port: config.port
  });
});
