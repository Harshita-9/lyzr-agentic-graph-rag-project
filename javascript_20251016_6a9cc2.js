import { OpenAI } from 'openai';
import ConfigManager from '../core/ConfigManager.js';

export class OntologyManager {
  constructor() {
    this.openai = new OpenAI({ apiKey: ConfigManager.ai.openai.apiKey });
    this.ontologyCache = new Map();
  }

  async generateOntologyFromDocuments(documents, domainHint = '') {
    const systemPrompt = `You are an expert ontologist and knowledge engineer. 
    Analyze the provided documents and generate a comprehensive ontology including:
    
    1. ENTITY TYPES with descriptions and key attributes
    2. RELATIONSHIP TYPES with semantic meaning
    3. HIERARCHICAL STRUCTURES (is-a relationships)
    4. DOMAIN-SPECIFIC PROPERTIES
    
    Return structured JSON that can be used to build a knowledge graph.`;

    const userPrompt = `Domain Context: ${domainHint}
    
    Documents: ${documents.slice(0, 3).map(doc => doc.content.substring(0, 2000)).join('\n\n')}
    
    Generate a comprehensive ontology in this exact JSON format:
    {
      "version": "1.0",
      "domain": "extracted_domain",
      "entities": [
        {
          "name": "EntityName",
          "description": "Clear description",
          "attributes": ["attr1", "attr2"],
          "relationships": ["relates_to_entity"],
          "examples": ["example1", "example2"]
        }
      ],
      "relationships": [
        {
          "name": "relationship_name",
          "description": "Semantic meaning",
          "source": "entity_type",
          "target": "entity_type",
          "properties": ["confidence", "evidence"]
        }
      ],
      "hierarchies": [
        {
          "parent": "GeneralConcept",
          "children": ["SpecificConcept1", "SpecificConcept2"]
        }
      ]
    }`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: ConfigManager.ai.openai.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      const ontology = JSON.parse(completion.choices[0].message.content);
      this.ontologyCache.set(domainHint, ontology);
      return ontology;
    } catch (error) {
      console.error('Ontology generation failed:', error);
      throw new Error(`Ontology generation failed: ${error.message}`);
    }
  }

  async refineOntologyWithLIM(existingOntology, userFeedback) {
    // LLM-assisted refinement
    const refinementPrompt = `Refine this ontology based on user feedback:
    
    Existing Ontology: ${JSON.stringify(existingOntology, null, 2)}
    
    User Feedback: ${userFeedback}
    
    Provide refined ontology with changes highlighted.`;

    const completion = await this.openai.chat.completions.create({
      model: ConfigManager.ai.openai.model,
      messages: [
        { 
          role: "system", 
          content: "You are an ontology refinement expert. Improve the structure based on feedback." 
        },
        { role: "user", content: refinementPrompt }
      ]
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  validateOntology(ontology) {
    const required = ['entities', 'relationships', 'hierarchies'];
    const missing = required.filter(field => !ontology[field]);
    
    if (missing.length > 0) {
      throw new Error(`Invalid ontology: Missing fields - ${missing.join(', ')}`);
    }
    
    return true;
  }
}