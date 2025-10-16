import { OntologyManager } from '../ontology/OntologyManager.js';
import ConfigManager from '../core/ConfigManager.js';

export class KnowledgeGraphBuilder {
  constructor(graphDriver) {
    this.ontologyManager = new OntologyManager();
    this.graphDriver = graphDriver;
    this.entityCache = new Map();
  }

  async buildGraphFromDocuments(documents, domain = 'general') {
    console.log('🔄 Building knowledge graph from', documents.length, 'documents');
    
    // Step 1: Generate ontology
    const ontology = await this.ontologyManager.generateOntologyFromDocuments(documents, domain);
    
    // Step 2: Extract entities and relationships
    const extractionResults = await this.extractGraphElements(documents, ontology);
    
    // Step 3: Entity resolution and deduplication
    const resolvedEntities = await this.resolveEntities(extractionResults.entities);
    
    // Step 4: Build graph in database
    await this.persistGraph(resolvedEntities, extractionResults.relationships, ontology);
    
    console.log('✅ Knowledge graph built successfully');
    return {
      nodesCreated: resolvedEntities.length,
      relationshipsCreated: extractionResults.relationships.length,
      ontology
    };
  }

  async extractGraphElements(documents, ontology) {
    const entities = [];
    const relationships = [];
    
    for (const doc of documents) {
      const docEntities = await this.extractEntitiesFromText(doc.content, ontology);
      const docRelationships = await this.extractRelationshipsFromText(doc.content, ontology, docEntities);
      
      entities.push(...docEntities);
      relationships.push(...docRelationships);
    }
    
    return { entities, relationships };
  }

  async extractEntitiesFromText(text, ontology) {
    const entityPrompt = `Extract entities from the text following this ontology:
    ${JSON.stringify(ontology.entities.map(e => e.name))}
    
    Text: ${text.substring(0, 3000)}
    
    Return JSON: [{"type": "EntityType", "name": "EntityName", "attributes": {}}]`;
    
    // Use LLM for entity extraction
    const entities = await this.callEntityExtractionLLM(entityPrompt);
    return entities.map(entity => ({
      ...entity,
      id: this.generateEntityId(entity.type, entity.name),
      embedding: await this.generateEmbedding(entity.name)
    }));
  }

  async resolveEntities(entities) {
    const resolved = [];
    const similarityThreshold = 0.85;
    
    for (const entity of entities) {
      let resolvedEntity = null;
      
      // Check cache and similarity
      for (const [key, cached] of this.entityCache) {
        const similarity = await this.calculateSimilarity(entity.embedding, cached.embedding);
        if (similarity > similarityThreshold) {
          resolvedEntity = { ...cached, mergedFrom: [...(cached.mergedFrom || []), entity.id] };
          break;
        }
      }
      
      if (!resolvedEntity) {
        resolvedEntity = { ...entity, canonicalId: entity.id };
        this.entityCache.set(entity.id, resolvedEntity);
      }
      
      resolved.push(resolvedEntity);
    }
    
    return resolved;
  }

  async persistGraph(entities, relationships, ontology) {
    const session = this.graphDriver.session();
    
    try {
      // Create constraint for uniqueness
      await session.run(`
        CREATE CONSTRAINT entity_id IF NOT EXISTS 
        FOR (e:Entity) REQUIRE e.canonicalId IS UNIQUE
      `);
      
      // Batch create entities
      const entityBatch = entities.map(entity => ({
        canonicalId: entity.canonicalId,
        type: entity.type,
        name: entity.name,
        attributes: entity.attributes,
        embedding: entity.embedding,
        mergedFrom: entity.mergedFrom || []
      }));
      
      await session.run(
        `UNWIND $entities AS entity
         MERGE (e:Entity {canonicalId: entity.canonicalId})
         SET e += apoc.map.removeKeys(entity, ['canonicalId'])`,
        { entities: entityBatch }
      );
      
      // Create relationships
      for (const rel of relationships) {
        await session.run(
          `MATCH (source:Entity {canonicalId: $sourceId})
           MATCH (target:Entity {canonicalId: $targetId})
           MERGE (source)-[r:${rel.type}]->(target)
           SET r += $properties`,
          {
            sourceId: rel.sourceId,
            targetId: rel.targetId,
            properties: rel.properties
          }
        );
      }
      
    } finally {
      await session.close();
    }
  }

  async generateEmbedding(text) {
    // Implementation for embedding generation
    // Using OpenAI or other embedding service
    return []; // Return vector embedding
  }

  async calculateSimilarity(embedding1, embedding2) {
    // Cosine similarity calculation
    return 0.9; // Placeholder
  }

  generateEntityId(type, name) {
    return `${type}_${name}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
}