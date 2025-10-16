import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import ConfigManager from './core/ConfigManager.js';
import GraphRAGRoutes from './api/GraphRAGRoutes.js';
import { MetricsCollector } from './utils/MetricsCollector.js';

class GraphRAGServer {
  constructor() {
    this.app = express();
    this.metricsCollector = new MetricsCollector();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use(limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'Agentic Graph RAG Service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json(this.metricsCollector.getPerformanceReport());
    });

    // Main API routes
    this.app.use('/api/graphrag', GraphRAGRoutes);

    // Demo endpoint
    this.app.get('/api/demo', async (req, res) => {
      res.json({
        message: 'Agentic Graph RAG Service Running',
        features: [
          'LIM-powered Ontology Generation',
          'Multi-Strategy Agentic Retrieval',
          'Entity Resolution & Deduplication',
          'Streaming Responses',
          'Visual Ontology Editor'
        ],
        version: '1.0.0'
      });
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Unhandled error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });
  }

  start() {
    const PORT = process.env.PORT || 3000;
    
    this.app.listen(PORT, () => {
      console.log(`
🚀 AGENTIC GRAPH RAG SERVICE STARTED
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Metrics: http://localhost:${PORT}/metrics
❤️ Health: http://localhost:${PORT}/health
      `);
    });
  }
}

// Start the server
const server = new GraphRAGServer();
server.start();

export default server;