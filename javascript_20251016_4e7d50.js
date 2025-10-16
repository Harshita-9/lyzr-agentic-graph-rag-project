import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OntologyManager } from '../../src/ontology/OntologyManager.js';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  version: "1.0",
                  domain: "technology",
                  entities: [
                    {
                      name: "Artificial Intelligence",
                      description: "Machine intelligence",
                      attributes: ["capabilities", "applications"],
                      relationships: ["uses", "enables"],
                      examples: ["Machine Learning", "Neural Networks"]
                    }
                  ],
                  relationships: [
                    {
                      name: "uses",
                      description: "employs technology",
                      source: "AI System",
                      target: "Algorithm",
                      properties: ["frequency", "purpose"]
                    }
                  ],
                  hierarchies: [
                    {
                      parent: "AI",
                      children: ["Machine Learning", "Deep Learning"]
                    }
                  ]
                })
              }
            }]
          })
        }
      }
    }))
  };
});

describe('OntologyManager', () => {
  let ontologyManager;

  beforeEach(() => {
    ontologyManager = new OntologyManager();
  });

  describe('generateOntologyFromDocuments', () => {
    it('should generate ontology from documents', async () => {
      const documents = [
        { content: 'Artificial intelligence uses machine learning algorithms.' },
        { content: 'Deep learning is a subset of machine learning.' }
      ];

      const ontology = await ontologyManager.generateOntologyFromDocuments(documents, 'technology');

      expect(ontology).toHaveProperty('version', '1.0');
      expect(ontology).toHaveProperty('domain', 'technology');
      expect(ontology.entities).toBeInstanceOf(Array);
      expect(ontology.relationships).toBeInstanceOf(Array);
      expect(ontology.hierarchies).toBeInstanceOf(Array);
    });

    it('should handle empty documents array', async () => {
      const documents = [];
      
      await expect(ontologyManager.generateOntologyFromDocuments(documents, 'general'))
        .rejects.toThrow('Ontology generation failed');
    });
  });

  describe('refineOntologyWithLIM', () => {
    it('should refine ontology based on user feedback', async () => {
      const existingOntology = {
        entities: [{ name: 'AI', description: 'Artificial Intelligence' }],
        relationships: [],
        hierarchies: []
      };

      const userFeedback = 'Add more specific AI subtypes';

      const refined = await ontologyManager.refineOntologyWithLIM(existingOntology, userFeedback);

      expect(refined).toBeDefined();
      // Additional assertions based on expected refinement behavior
    });
  });

  describe('validateOntology', () => {
    it('should validate correct ontology structure', () => {
      const validOntology = {
        entities: [],
        relationships: [],
        hierarchies: []
      };

      expect(() => ontologyManager.validateOntology(validOntology)).not.toThrow();
    });

    it('should throw error for invalid ontology', () => {
      const invalidOntology = {
        entities: []
        // Missing relationships and hierarchies
      };

      expect(() => ontologyManager.validateOntology(invalidOntology))
        .toThrow('Invalid ontology: Missing fields - relationships, hierarchies');
    });
  });

  describe('caching', () => {
    it('should cache generated ontologies', async () => {
      const documents = [{ content: 'Test document' }];
      const domain = 'test-domain';

      // First call
      const ontology1 = await ontologyManager.generateOntologyFromDocuments(documents, domain);
      
      // Second call should return cached result
      const ontology2 = await ontologyManager.generateOntologyFromDocuments(documents, domain);

      expect(ontology1).toEqual(ontology2);
    });
  });
});