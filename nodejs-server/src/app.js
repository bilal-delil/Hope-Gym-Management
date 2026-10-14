const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  helmet({
    // Allow admin/PWA on other origins to call the API and use Google GIS.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (env.nodeEnv !== 'production' && env.isDevFriendlyOrigin?.(origin)) {
        callback(null, true);
        return;
      }
      // Fallback: allow listed origins only
      const allowed = env.corsOrigins.includes(origin);
      callback(allowed ? null : new Error(`CORS blocked: ${origin}`), allowed);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'))
);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
