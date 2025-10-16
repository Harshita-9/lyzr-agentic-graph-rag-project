import React, { useRef, useEffect, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const OntologyVisualEditor = ({ ontology, onOntologyUpdate }) => {
  const networkRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (networkRef.current && ontology) {
      initializeNetwork();
    }
  }, [ontology]);

  const initializeNetwork = () => {
    const nodes = new DataSet(
      ontology.entities.map(entity => ({
        id: entity.name,
        label: entity.name,
        group: 'entity',
        title: entity.description
      }))
    );

    const edges = new DataSet(
      ontology.relationships.map(rel => ({
        id: `${rel.source}-${rel.target}`,
        from: rel.source,
        to: rel.target,
        label: rel.name,
        arrows: 'to'
      }))
    );

    const data = { nodes, edges };
    const options = {
      layout: { improvedLayout: true },
      physics: { enabled: true },
      interaction: { dragNodes: true }
    };

    new Network(networkRef.current, data, options);
  };

  const handleLIMRefinement = async () => {
    // Call LIM for ontology refinement suggestions
    const response = await fetch('/api/ontology/refine', {
      method: 'POST',
      body: JSON.stringify({ ontology, feedback: 'auto-refine' })
    });
    
    const suggestions = await response.json();
    setSuggestions(suggestions);
  };

  return (
    <div className="ontology-editor">
      <div className="toolbar">
        <button onClick={handleLIMRefinement} className="btn-lim">
          🧠 LIM-Assisted Refinement
        </button>
      </div>
      
      <div ref={networkRef} className="network-container" />
      
      {suggestions.length > 0 && (
        <div className="suggestions-panel">
          <h3>LIM Suggestions</h3>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OntologyVisualEditor;