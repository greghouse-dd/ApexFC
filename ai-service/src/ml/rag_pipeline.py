import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DOCS_DIR = os.path.join(BASE_DIR, "data", "external_documents")
DB_DIR = os.path.join(BASE_DIR, "data", "vector_db")

def build_rag_pipeline():
    print(f"Loading documents from {DOCS_DIR}...")
    # Load txt and md files
    loader = DirectoryLoader(DOCS_DIR, glob="**/*.md", loader_cls=TextLoader)
    documents = loader.load()
    
    if not documents:
        print("No documents found to process. Please add .md files to data/external_documents/")
        return
        
    print(f"Loaded {len(documents)} documents.")
    
    print("Chunking documents...")
    # Chunk size of 500 characters, overlap of 50
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} chunks.")
    
    print("Initializing embedding model (all-MiniLM-L6-v2)...")
    # Using standard fast local sentence-transformers model
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    print(f"Creating Chroma Vector DB at {DB_DIR}...")
    os.makedirs(DB_DIR, exist_ok=True)
    
    # Create the vector store
    vectordb = Chroma.from_documents(
        documents=chunks, 
        embedding=embeddings, 
        persist_directory=DB_DIR
    )
    
    vectordb.persist()
    print("Vector database persisted successfully.")
    
    # Quick Test
    print("\n--- Testing RAG Retrieval ---")
    query = "What is gegenpressing?"
    print(f"Query: '{query}'")
    results = vectordb.similarity_search(query, k=1)
    if results:
        print(f"Top Match: {results[0].page_content}")
    else:
        print("No results found.")
        
    print("\nRAG Pipeline setup complete!")

if __name__ == "__main__":
    build_rag_pipeline()
