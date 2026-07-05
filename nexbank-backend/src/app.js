import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import logger from './config/logger.js';
import { getStoreType } from './config/redis.js';

const app = express();

/**
 * Configure Express middleware stack.
 */
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * Health check endpoint.
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'nexbank-api',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      store: getStoreType() || 'not_initialized',
      timestamp: new Date().toISOString(),
    },
    message: 'NexBank API is running',
  });
});

/**
 * API v1 base route — feature routes will be mounted here in subsequent steps.
 */
app.use('/api/v1', (_req, res) => {
  res.status(200).json({
    success: true,
    data: { version: '1.0.0' },
    message: 'NexBank API v1',
  });
});

/**
 * 404 handler for unmatched routes.
 */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
});

/**
 * Global error handler.
 */
app.use((err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

export default app;
