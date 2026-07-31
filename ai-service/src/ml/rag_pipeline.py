import os
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DOCS_DIR = os.path.join(BASE_DIR, "data", "external_documents")
DB_DIR = os.path.join(BASE_DIR, "data", "vector_db")

# Deterministic metadata mapping for tactical concepts in tactics_guide.md
CONCEPT_METADATA_MAP = {
    # Principles of Play
    "Width": {
        "category": "Principles of Play",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Overloads", "Underlap", "Overlap", "Switch of Play"]
    },
    "Depth": {
        "category": "Principles of Play",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Attacking Transition", "Line-Breaking Pass", "False Nine"]
    },
    "Overloads": {
        "category": "Principles of Play",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Switch of Play", "Width", "Underlap"]
    },
    "Numerical Superiority": {
        "category": "Principles of Play",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Positional Play (Juego de Posición)", "Build-Up from the Back", "Overloads"]
    },
    "Positional Superiority": {
        "category": "Principles of Play",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Positional Play (Juego de Posición)", "Half-Spaces", "Line-Breaking Pass"]
    },
    "Qualitative Superiority": {
        "category": "Principles of Play",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Overloads", "Switch of Play", "Width"]
    },
    
    # Attacking Concepts
    "Positional Play (Juego de Posición)": {
        "category": "Attacking System",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Positional Superiority", "Half-Spaces", "Inverted Full-Back"]
    },
    "Vertical Play": {
        "category": "Attacking System",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Line-Breaking Pass", "Attacking Transition", "Direct Play"]
    },
    "Direct Play": {
        "category": "Attacking System",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Target Man", "Second Balls", "Attacking Transition"]
    },
    "Build-Up from the Back": {
        "category": "Attacking System",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Numerical Superiority", "Double Pivot", "Pressing Shadows (Cover Shadows)"]
    },
    "Attacking Transition": {
        "category": "Attacking System",
        "phase": "Transition",
        "document_type": "concept",
        "related_concepts": ["Counter-Pressing (Gegenpressing)", "Rest Defence", "Counter-Attacking"]
    },
    
    # Defensive Structures
    "High Press": {
        "category": "Defensive Structure",
        "phase": "Defence",
        "document_type": "concept",
        "related_concepts": ["Pressing Triggers", "Pressing Shadows (Cover Shadows)", "Build-Up from the Back"]
    },
    "Mid-Block": {
        "category": "Defensive Structure",
        "phase": "Defence",
        "document_type": "concept",
        "related_concepts": ["Low Block", "Compactness"]
    },
    "Low Block": {
        "category": "Defensive Structure",
        "phase": "Defence",
        "document_type": "concept",
        "related_concepts": ["Counter-Attacking", "Mid-Block"]
    },
    "Counter-Pressing (Gegenpressing)": {
        "category": "Defensive Action",
        "phase": "Transition",
        "document_type": "concept",
        "related_concepts": ["Attacking Transition", "Rest Defence", "Pressing Triggers"]
    },
    "Rest Defence": {
        "category": "Defensive Structure",
        "phase": "Defence",
        "document_type": "concept",
        "related_concepts": ["Counter-Attacking", "Dynamic Rest Defence", "Counter-Pressing (Gegenpressing)"]
    },
    "Dynamic Rest Defence": {
        "category": "Defensive Structure",
        "phase": "Defence",
        "document_type": "concept",
        "related_concepts": ["Rest Defence", "Pressing Shadows (Cover Shadows)"]
    },
    "Touchline Trap": {
        "category": "Defensive Action",
        "phase": "Defence",
        "document_type": "tactical_pattern",
        "related_concepts": ["Pressing Triggers", "High Press", "Pressing Shadows (Cover Shadows)"]
    },
    "Trap Pressing (Pressing Traps)": {
        "category": "Defensive Action",
        "phase": "Defence",
        "document_type": "tactical_pattern",
        "related_concepts": ["Pressing Triggers", "High Press"]
    },
    "Pressing Shadows (Cover Shadows)": {
        "category": "Defensive Action",
        "phase": "Defence",
        "document_type": "tactical_pattern",
        "related_concepts": ["High Press", "Pressing Triggers"]
    },
    
    # Player Roles & Movements
    "False Nine": {
        "category": "Player Role",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Positional Play (Juego de Posición)", "Blind-side run", "Pinning a defender (Pinning)"]
    },
    "Inverted Full-Back": {
        "category": "Player Role",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Rest Defence", "Double Pivot"]
    },
    "Target Man": {
        "category": "Player Role",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Direct Play", "Second Balls"]
    },
    "Deep-Lying Playmaker": {
        "category": "Player Role",
        "phase": "Attack",
        "document_type": "concept",
        "related_concepts": ["Build-Up from the Back", "Double Pivot"]
    },
    "Libero": {
        "category": "Player Role",
        "phase": "Defence",
        "document_type": "concept",
        "related_concepts": ["Build-Up from the Back"]
    },
    "Overlap": {
        "category": "Player Movement",
        "phase": "Attack",
        "document_type": "tactical_pattern",
        "related_concepts": ["Width", "Overlapping Run"]
    },
    "Underlap": {
        "category": "Player Movement",
        "phase": "Attack",
        "document_type": "tactical_pattern",
        "related_concepts": ["Half-Spaces", "Underlapping Run"]
    },
    "Blind-side run": {
        "category": "Player Movement",
        "phase": "Attack",
        "document_type": "tactical_pattern",
        "related_concepts": ["Half-Spaces", "Depth"]
    },
    "Pinning a defender (Pinning)": {
        "category": "Player Movement",
        "phase": "Attack",
        "document_type": "tactical_pattern",
        "related_concepts": ["Width", "Overloads", "Attacking Transition"]
    },
    "Decoy runs": {
        "category": "Player Movement",
        "phase": "Attack",
        "document_type": "tactical_pattern",
        "related_concepts": ["Attacking Transition", "Rest Defence"]
    },
    "Curved pressing runs": {
        "category": "Player Movement",
        "phase": "Defence",
        "document_type": "tactical_pattern",
        "related_concepts": ["High Press", "Pressing Shadows (Cover Shadows)"]
    },
    "Third-man runs": {
        "category": "Player Movement",
        "phase": "Attack",
        "document_type": "tactical_pattern",
        "related_concepts": ["Numerical Superiority", "Third-Man Combination"]
    },
    
    # Team Interactions
    "Build Up vs High Press": {
        "category": "Team Interaction",
        "phase": "Attack/Defence",
        "document_type": "team_interaction",
        "related_concepts": ["Build-Up from the Back", "High Press", "Numerical Superiority"]
    },
    "Counter Press vs Rest Defence": {
        "category": "Team Interaction",
        "phase": "Transition",
        "document_type": "team_interaction",
        "related_concepts": ["Counter-Pressing (Gegenpressing)", "Rest Defence", "Dynamic Rest Defence"]
    },
    "Positional Play vs Low Block": {
        "category": "Team Interaction",
        "phase": "Attack",
        "document_type": "team_interaction",
        "related_concepts": ["Positional Play (Juego de Posición)", "Low Block", "Half-Spaces", "Overloads"]
    },
    "Attacking Transition vs Rest Defence": {
        "category": "Team Interaction",
        "phase": "Transition",
        "document_type": "team_interaction",
        "related_concepts": ["Attacking Transition", "Rest Defence"]
    },
    
    # Training Exercises
    "Pressing Drills": {
        "category": "Training Exercise",
        "phase": "Defence",
        "document_type": "training_drill",
        "related_concepts": ["High Press", "Pressing Triggers", "Pressing Shadows (Cover Shadows)"]
    },
    "Transition Drills (Transition Rondos)": {
        "category": "Training Exercise",
        "phase": "Transition",
        "document_type": "training_drill",
        "related_concepts": ["Attacking Transition", "Counter-Pressing (Gegenpressing)", "Rest Defence"]
    },
    "Positional Games": {
        "category": "Training Exercise",
        "phase": "Attack",
        "document_type": "training_drill",
        "related_concepts": ["Positional Play (Juego de Posición)", "Half-Spaces", "Positional Superiority"]
    },
    "Rondos": {
        "category": "Training Exercise",
        "phase": "Attack",
        "document_type": "training_drill",
        "related_concepts": ["Numerical Superiority", "Width"]
    },
    "Wave Attacks": {
        "category": "Training Exercise",
        "phase": "Attack",
        "document_type": "training_drill",
        "related_concepts": ["Attacking Transition", "Counter-Attacking", "Overloads"]
    },
    
    # Match Analysis
    "Manchester City": {
        "category": "Match Analysis",
        "phase": "General",
        "document_type": "case_study",
        "related_concepts": ["Positional Play (Juego de Posición)", "Inverted Full-Back", "Rest Defence"]
    },
    "Liverpool": {
        "category": "Match Analysis",
        "phase": "General",
        "document_type": "case_study",
        "related_concepts": ["Counter-Pressing (Gegenpressing)", "High Press", "Attacking Transition"]
    },
    "Arsenal": {
        "category": "Match Analysis",
        "phase": "General",
        "document_type": "case_study",
        "related_concepts": ["Touchline Trap", "Overloads"]
    },
    "Barcelona": {
        "category": "Match Analysis",
        "phase": "General",
        "document_type": "case_study",
        "related_concepts": ["Numerical Superiority", "Width", "Tiki-Taka", "Positional Play (Juego de Posición)"]
    },
    "Bayer Leverkusen": {
        "category": "Match Analysis",
        "phase": "General",
        "document_type": "case_study",
        "related_concepts": ["Double Pivot", "Vertical Play"]
    },
}

def build_rag_pipeline():
    print(f"Loading documents from {DOCS_DIR}...")
    
    # Read files, splitting them by ## headers
    chunks = []
    headers_to_split_on = [
        ("##", "title"),
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    
    if not os.path.exists(DOCS_DIR):
        print(f"Documents directory does not exist: {DOCS_DIR}")
        return
        
    for root, _, files in os.walk(DOCS_DIR):
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                print(f"Processing file: {file_path}")
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Split content by headers
                file_chunks = markdown_splitter.split_text(content)
                chunks.extend(file_chunks)
                
    if not chunks:
        print("No document chunks split. Please add markdown files with '##' headings.")
        return
        
    # Map title, category, phase, document_type, and related_concepts in metadata
    valid_chunks = []
    for chunk in chunks:
        title = chunk.metadata.get("title", "").strip()
        if not title or title == "Tactical Concepts":
            # Skip empty headers or main document title
            continue
            
        mapping = CONCEPT_METADATA_MAP.get(title, {})
        chunk.metadata["title"] = title
        chunk.metadata["category"] = mapping.get("category", "General Tactics")
        chunk.metadata["phase"] = mapping.get("phase", "General")
        chunk.metadata["document_type"] = mapping.get("document_type", "concept")
        chunk.metadata["related_concepts"] = mapping.get("related_concepts", [])
        
        valid_chunks.append(chunk)
        
    print(f"Extracted {len(valid_chunks)} tactical concepts/chunks.")
    
    print("Initializing embedding model (BAAI/bge-small-en-v1.5)...")
    embeddings = HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en-v1.5",
        model_kwargs={"device": "cpu"}
    )
    
    print(f"Creating FAISS (HNSW) Vector DB at {DB_DIR}...")
    os.makedirs(DB_DIR, exist_ok=True)
    
    # Generate a dummy embedding to know index dimensions
    test_emb = embeddings.embed_query("test")
    dimension = len(test_emb)
    
    # Create HNSW index
    index = faiss.IndexHNSWFlat(dimension, 32)
    
    vectordb = FAISS(
        embedding_function=embeddings,
        index=index,
        docstore=InMemoryDocstore(),
        index_to_docstore_id={}
    )
    
    # Add documents to index
    vectordb.add_documents(valid_chunks)
    
    # Save the local index
    vectordb.save_local(DB_DIR)
    print("FAISS database persisted successfully.")
    
    # Quick Test
    print("\n--- Testing RAG Retrieval ---")
    query = "What is Gegenpressing?"
    print(f"Query: '{query}'")
    results = vectordb.similarity_search(query, k=1)
    if results:
        print(f"Top Match: {results[0].metadata.get('title')}")
        print(f"Content: {results[0].page_content[:150]}...")
        print(f"Metadata: {results[0].metadata}")
    else:
        print("No results found.")
        
    print("\nRAG Pipeline build complete!")

if __name__ == "__main__":
    build_rag_pipeline()
