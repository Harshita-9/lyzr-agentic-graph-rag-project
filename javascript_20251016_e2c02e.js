// Query the knowledge base
const response = await fetch('/api/graphrag/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Explain transformer architectures in NLP",
    stream: true,
    context: { domain: "machine-learning" }
  })
});