export class GraphTraversalAgent {
  constructor(graphDriver) {
    this.graphDriver = graphDriver;
    this.cypherGenerator = new CypherGenerator();
  }

  async retrieve(query, analysis, context = {}) {
    console.log('🕸️ Executing graph traversal retrieval');
    
    // Generate Cypher query using LLM
    const cypherQuery = await this.generateCypherQuery(query, analysis);
    
    // Execute graph query
    const graphResults = await this.executeGraphQuery(cypherQuery);
    
    // Convert graph results to document format
    const documents = this.graphResultsToDocuments(graphResults);
    
    return {
      documents,
      query: cypherQuery,
      agentStrategy: 'relational',
      resultType: 'graph'
    };
  }

  async generateCypherQuery(naturalLanguageQuery, analysis) {
    const cypherPrompt = `Convert this natural language query to Cypher for Neo4j:
    
    Query: "${naturalLanguageQuery}"
    
    Query Analysis: ${JSON.stringify(analysis)}
    
    Available node labels: Entity, Concept, Document
    Available relationships: RELATED_TO, PART_OF, MENTIONS, SIMILAR_TO
    
    Return ONLY the Cypher query without explanations.`;

    // Use LLM to generate Cypher
    const generatedQuery = await this.callCypherGenerationLLM(cypherPrompt);
    
    // Validate and sanitize the query
    return this.sanitizeCypherQuery(generatedQuery);
  }

  async executeGraphQuery(cypherQuery) {
    const session = this.graphDriver.session();
    
    try {
      const result = await session.run(cypherQuery);
      return result.records.map(record => record.toObject());
    } catch (error) {
      console.error('Graph query execution failed:', error);
      throw new Error(`Graph query failed: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  graphResultsToDocuments(graphResults) {
    return graphResults.map((result, index) => ({
      id: `graph_${index}`,
      content: this.formatGraphResult(result),
      metadata: {
        type: 'graph_result',
        nodes: this.extractNodes(result),
        relationships: this.extractRelationships(result),
        score: this.calculateGraphRelevance(result)
      },
      score: this.calculateGraphRelevance(result)
    }));
  }

  formatGraphResult(graphRecord) {
    // Convert graph record to readable text
    const nodes = Object.values(graphRecord).filter(val => 
      val && typeof val === 'object' && val.labels
    );
    
    return nodes.map(node => 
      `Entity: ${node.properties?.name || 'Unknown'} (${node.labels.join(', ')})`
    ).join(' | ');
  }

  calculateGraphRelevance(graphRecord) {
    // Calculate relevance score based on graph structure
    let score = 0.5; // Base score
    
    // Boost for connected nodes
    const connections = Object.values(graphRecord).filter(val => 
      val && typeof val === 'object' && val.type === 'relationship'
    ).length;
    
    score += Math.min(connections * 0.1, 0.3);
    
    return Math.min(score, 1.0);
  }

  sanitizeCypherQuery(query) {
    // Basic security sanitization
    const dangerousPatterns = [/DROP/i, /DELETE/i, /CREATE\s+CONSTRAINT/i, /CREATE\s+INDEX/i];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        throw new Error('Potentially dangerous Cypher query detected');
      }
    }
    
    return query;
  }
}