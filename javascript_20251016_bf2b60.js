import { OpenAI } from 'openai';
import ConfigManager from '../core/ConfigManager.js';

export class LogicalFilteringAgent {
  constructor() {
    this.openai = new OpenAI({ apiKey: ConfigManager.ai.openai.apiKey });
  }

  async retrieve(query, analysis, context = {}) {
    console.log('🔎 Executing logical filtering retrieval');
    
    const startTime = Date.now();
    
    try {
      // Extract logical constraints from query
      const constraints = await this.extractConstraints(query, analysis);
      
      // Build database query based on constraints
      const databaseQuery = this.buildDatabaseQuery(constraints, context);
      
      // Execute query (mock implementation - integrate with actual database)
      const results = await this.executeLogicalQuery(databaseQuery);
      
      const latency = Date.now() - startTime;
      
      return {
        documents: this.formatLogicalResults(results, constraints),
        agentStrategy: 'factual',
        latency,
        confidence: this.calculateLogicalConfidence(constraints, results),
        metadata: {
          constraints,
          query: databaseQuery,
          resultCount: results.length
        }
      };
      
    } catch (error) {
      console.error('Logical filtering error:', error);
      throw new Error(`Logical filtering failed: ${error.message}`);
    }
  }

  async extractConstraints(naturalLanguageQuery, analysis) {
    const constraintPrompt = `Extract logical constraints and filters from this query:
    
    Query: "${naturalLanguageQuery}"
    
    Return JSON with:
    - attributes: key-value pairs for filtering
    - temporalConstraints: date/time ranges
    - categoricalFilters: category-based filters
    - numericalRanges: number ranges
    - requiredFields: fields that must be present
    
    Example:
    {
      "attributes": {"status": "completed", "type": "research"},
      "temporalConstraints": {"startDate": "2023-01-01", "endDate": "2023-12-31"},
      "categoricalFilters": ["machine-learning", "nlp"],
      "numericalRanges": {"confidence": {"min": 0.8}},
      "requiredFields": ["author", "publication_date"]
    }`;
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: ConfigManager.ai.openai.model,
        messages: [{ role: "user", content: constraintPrompt }],
        temperature: 0.1,
        max_tokens: 500
      });
      
      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Constraint extraction failed:', error);
      return this.fallbackConstraintExtraction(naturalLanguageQuery);
    }
  }

  fallbackConstraintExtraction(query) {
    // Simple regex-based fallback for constraint extraction
    const constraints = {
      attributes: {},
      temporalConstraints: {},
      categoricalFilters: [],
      numericalRanges: {},
      requiredFields: []
    };
    
    // Extract dates
    const datePattern = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})\b/g;
    const dates = query.match(datePattern);
    if (dates) {
      constraints.temporalConstraints = { dates };
    }
    
    // Extract numbers
    const numberPattern = /\b(\d+\.?\d*)\b/g;
    const numbers = query.match(numberPattern);
    if (numbers) {
      constraints.numericalRanges = { values: numbers.map(Number) };
    }
    
    return constraints;
  }

  buildDatabaseQuery(constraints, context) {
    const query = {
      selector: {},
      fields: constraints.requiredFields,
      sort: [{ timestamp: 'desc' }],
      limit: 10
    };
    
    // Add attribute filters
    if (Object.keys(constraints.attributes).length > 0) {
      query.selector = { ...query.selector, ...constraints.attributes };
    }
    
    // Add temporal constraints
    if (Object.keys(constraints.temporalConstraints).length > 0) {
      query.selector.timestamp = this.buildTimestampFilter(constraints.temporalConstraints);
    }
    
    // Add domain context
    if (context.domain) {
      query.selector.domain = context.domain;
    }
    
    return query;
  }

  buildTimestampFilter(temporalConstraints) {
    const filter = {};
    
    if (temporalConstraints.startDate) {
      filter.$gte = temporalConstraints.startDate;
    }
    
    if (temporalConstraints.endDate) {
      filter.$lte = temporalConstraints.endDate;
    }
    
    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  async executeLogicalQuery(query) {
    // Mock implementation - replace with actual database queries
    // This would typically query MongoDB, PostgreSQL, or similar
    
    console.log('Executing logical query:', JSON.stringify(query, null, 2));
    
    // Simulate database query results
    return [
      {
        id: 'doc_001',
        content: 'Document matching logical constraints',
        metadata: {
          type: 'filtered_result',
          attributes: query.selector,
          score: 0.95
        },
        score: 0.95
      },
      {
        id: 'doc_002', 
        content: 'Another relevant document based on filters',
        metadata: {
          type: 'filtered_result',
          attributes: query.selector,
          score: 0.87
        },
        score: 0.87
      }
    ];
  }

  formatLogicalResults(results, constraints) {
    return results.map((result, index) => ({
      ...result,
      metadata: {
        ...result.metadata,
        constraintMatch: this.calculateConstraintMatch(result, constraints),
        filteringMethod: 'logical_attributes'
      }
    }));
  }

  calculateConstraintMatch(result, constraints) {
    let matchScore = 0.8; // Base score for filtered results
    const matchedConstraints = [];
    
    // Calculate how well the result matches the extracted constraints
    if (constraints.attributes && Object.keys(constraints.attributes).length > 0) {
      matchedConstraints.push('attributes');
      matchScore += 0.1;
    }
    
    if (constraints.temporalConstraints && Object.keys(constraints.temporalConstraints).length > 0) {
      matchedConstraints.push('temporal');
      matchScore += 0.05;
    }
    
    if (constraints.categoricalFilters && constraints.categoricalFilters.length > 0) {
      matchedConstraints.push('categorical');
      matchScore += 0.05;
    }
    
    return {
      score: Math.min(matchScore, 1.0),
      matchedConstraints
    };
  }

  calculateLogicalConfidence(constraints, results) {
    if (results.length === 0) return 0.1;
    
    let confidence = 0.6; // Base confidence for logical filtering
    
    // Boost for specific constraints
    const constraintCount = Object.keys(constraints.attributes).length + 
                           Object.keys(constraints.temporalConstraints).length +
                           constraints.categoricalFilters.length;
    
    if (constraintCount > 0) {
      confidence += Math.min(constraintCount * 0.1, 0.3);
    }
    
    // Boost for multiple results
    if (results.length >= 2) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }
}