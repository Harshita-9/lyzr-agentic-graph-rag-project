import express from 'express';
import { RetrievalOrchestrator } from '../agents/RetrievalOrchestrator.js';
import { KnowledgeGraphBuilder } from '../graph/KnowledgeGraphBuilder.js';
import { StreamingResponseManager } from '../utils/StreamingResponseManager.js';

const router = express.Router();
const retrievalOrchestrator = new RetrievalOrchestrator();
const streamingManager = new StreamingResponseManager();

// Main query endpoint with streaming
router.post('/query', async (req, res) => {
  try {
    const { query, context, stream = false } = req.body;
    
    if (stream) {
      await handleStreamingQuery(res, query, context);
    } else {
      const results = await retrievalOrchestrator.processQuery(query, context);
      res.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Query processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Document ingestion endpoint
router.post('/ingest', async (req, res) => {
  try {
    const { documents, domain, options = {} } = req.body;
    
    const graphBuilder = new KnowledgeGraphBuilder(req.graphDriver);
    const result = await graphBuilder.buildGraphFromDocuments(documents, domain);
    
    res.json({
      success: true,
      data: result,
      message: `Successfully ingested ${documents.length} documents`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ontology management
router.get('/ontology/:domain', async (req, res) => {
  // Get current ontology for domain
});

router.put('/ontology/:domain', async (req, res) => {
  // Update ontology with LIM assistance
});

// Analytics and monitoring
router.get('/analytics/retrieval-metrics', async (req, res) => {
  // Return retrieval performance metrics
});

async function handleStreamingQuery(res, query, context) {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked'
  });
  
  try {
    const stream = await streamingManager.createStream(query, context);
    
    for await (const chunk of stream) {
      res.write(JSON.stringify(chunk) + '\n');
    }
    
    res.end();
  } catch (error) {
    res.write(JSON.stringify({
      type: 'error',
      content: error.message
    }) + '\n');
    res.end();
  }
}

export default router;