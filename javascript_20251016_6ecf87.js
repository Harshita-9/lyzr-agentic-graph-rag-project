import Joi from 'joi';

export const QueryValidationSchema = Joi.object({
  query: Joi.string().min(1).max(1000).required(),
  context: Joi.object().optional(),
  stream: Joi.boolean().default(false),
  strategy: Joi.string().valid('auto', 'semantic', 'graph', 'hybrid').default('auto')
});

export const DocumentIngestionSchema = Joi.object({
  documents: Joi.array().items(
    Joi.object({
      id: Joi.string().optional(),
      content: Joi.string().required(),
      metadata: Joi.object().optional(),
      type: Joi.string().valid('text', 'pdf', 'markdown').default('text')
    })
  ).min(1).required(),
  domain: Joi.string().max(100).required(),
  options: Joi.object({
    generateOntology: Joi.boolean().default(true),
    deduplicate: Joi.boolean().default(true),
    chunkSize: Joi.number().default(1000)
  }).optional()
});

export const OntologyUpdateSchema = Joi.object({
  ontology: Joi.object({
    entities: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required()
    })).required(),
    relationships: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      source: Joi.string().required(),
      target: Joi.string().required()
    })).required()
  }).required(),
  feedback: Joi.string().optional()
});