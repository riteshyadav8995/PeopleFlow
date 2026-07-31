// ──────────────────────────────────────────────
// PeopleFlow — Express Application
// ──────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { corsConfig } from './config';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { registerRoutes } from './routes';

const app = express();

// ─── Security ────────────────────────────────
app.use(helmet());
app.use(cors(corsConfig));

// ─── Parsing ─────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Compression ─────────────────────────────
app.use(compression());

// ─── Request tracking ────────────────────────
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

// ─── Routes ──────────────────────────────────
registerRoutes(app);

// ─── 404 & Error handling ────────────────────
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
