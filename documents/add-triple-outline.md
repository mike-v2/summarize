## Knowledge Graph Workflow

This workflow describes the process of integrating fact-based claims from summaries into a knowledge graph (KG) using Neo4j and embedding storage.

### Step 0: Summary Creation and User Validation

- Use an LLM to generate a summary of the original document (e.g., news article, video transcript).
- The summary must clearly list fact-based claims.
- Present each claim to the user with an option to add it to the KG.

### When a User Adds a Claim to the KG:

#### Step 1: Initial Entity Extraction

- Use an LLM to extract named entities from the claim (preliminary step, entities are not final).

**Example Prompt:**

```plaintext
Extract all named entities from the following claim:
"GPT-5 significantly advances AI reasoning capabilities."

Entities:
- GPT-5
- AI reasoning
```

#### Step 2: Triple Extraction

- Use an LLM to extract structured triples (subject, relation, object) from the claim.
- Use subjects and objects from these triples as your definitive named entities.

**Example Prompt:**

```plaintext
Extract structured triples from the following claim:
"GPT-5 significantly advances AI reasoning capabilities."

Extracted Triples:
- (GPT-5, advances, AI reasoning capabilities)
```

#### Step 3: Synonym Detection

- Embed the definitive entities (subjects and objects from the extracted triples) using an embedding model.
- Use cosine similarity to compare these embeddings against existing entity embeddings stored in a vector database (e.g., Pinecone).
- Define a similarity threshold (e.g., ≥ 0.9) to identify synonyms.
- Maintain and persistently store a synonym mapping (e.g., JSON file or database table).

**Example Synonym Mapping:**

```json
{
  "GPT-5": "Generative Pre-trained Transformer 5",
  "AI reasoning capabilities": "Artificial Intelligence reasoning"
}
```

#### Step 4: Populate the Knowledge Graph

- Store the extracted triples in Neo4j.
- Create/update phrase nodes for each unique entity from the triples.
- Create/update a passage node for the document summary.
- Add context edges linking phrase nodes to the passage node.
- Add relationship edges between phrase nodes based on extracted triples.
- Explicitly add synonym edges between phrase nodes using the synonym mapping.

**Example Cypher Queries:**

```cypher
MERGE (passage:Passage {text: "GPT-5 significantly advances AI reasoning capabilities."})

MERGE (entity1:Phrase {text: "GPT-5"})
MERGE (entity2:Phrase {text: "AI reasoning capabilities"})

MERGE (entity1)-[:ADVANCES]->(entity2)
MERGE (passage)-[:CONTAINS]->(entity1)
MERGE (passage)-[:CONTAINS]->(entity2)
```

#### Step 5: Embedding Storage in Pinecone

- Generate embeddings for each Neo4j node (phrase nodes and passage node).
- Store these embeddings in Pinecone along with the Neo4j node IDs.

**Example Pinecone Entry:**

```json
{
  "id": "neo4j-node-id-456",
  "values": [0.12, 0.34, ...],
  "metadata": {
    "neo4j_id": "456",
    "text": "GPT-5",
    "type": "phrase"
  }
}
```

### Outcome

This structured workflow ensures:

- Efficient KG population.
- Semantic similarity and synonym handling.
- Rich, interconnected, and retrievable knowledge representations for downstream tasks.

