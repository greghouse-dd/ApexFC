import os
import sys
import sqlite3
import numpy as np
import json
import uuid
import time
from typing import List, Optional, Generator
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

# --- Pre-load concept list once at module level ---
_CONCEPT_KEYS_CACHE = None

def _get_concept_keys():
    """Load and cache the concept keys from rag_pipeline at module level."""
    global _CONCEPT_KEYS_CACHE
    if _CONCEPT_KEYS_CACHE is not None:
        return _CONCEPT_KEYS_CACHE
    ai_src_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "ai-service", "src", "ml")
    if ai_src_dir not in sys.path:
        sys.path.append(ai_src_dir)
    try:
        from rag_pipeline import CONCEPT_METADATA_MAP
        _CONCEPT_KEYS_CACHE = list(CONCEPT_METADATA_MAP.keys())
    except ImportError:
        _CONCEPT_KEYS_CACHE = ["Width", "Depth", "Overloads", "Numerical Superiority", "Positional Superiority", "Qualitative Superiority", "Positional Play (Juego de Posición)", "Vertical Play", "Direct Play", "Build-Up from the Back", "Attacking Transition", "High Press", "Mid-Block", "Low Block", "Counter-Pressing (Gegenpressing)", "Rest Defence", "Dynamic Rest Defence", "Touchline Trap", "Trap Pressing (Pressing Traps)", "Pressing Shadows (Cover Shadows)", "False Nine", "Inverted Full-Back", "Target Man", "Deep-Lying Playmaker", "Libero", "Overlap", "Underlap", "Blind-side run", "Pinning a defender (Pinning)", "Decoy runs", "Curved pressing runs", "Third-man runs", "Build Up vs High Press", "Counter Press vs Rest Defence", "Positional Play vs Low Block", "Attacking Transition vs Rest Defence", "Pressing Drills", "Transition Drills (Transition Rondos)", "Positional Games", "Rondos", "Wave Attacks", "Manchester City", "Liverpool", "Arsenal", "Barcelona", "Bayer Leverkusen"]
    return _CONCEPT_KEYS_CACHE

from app.models.player import Player

def _resolve_ai_service_dir():
    base_file = os.path.abspath(__file__)
    curr = os.path.dirname(base_file)
    for _ in range(5):
        candidate = os.path.join(curr, "ai-service")
        if os.path.exists(candidate):
            return candidate
        parent = os.path.dirname(curr)
        if parent == curr:
            break
        curr = parent
    for render_path in ["/opt/render/project/src/ai-service", "/opt/render/project/ai-service", "./ai-service"]:
        if os.path.exists(render_path):
            return os.path.abspath(render_path)
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(base_file)))), "ai-service")

# Absolute paths to the ai-service directory
AI_SERVICE_DIR = _resolve_ai_service_dir()
ML_DATA_DIR = os.path.join(AI_SERVICE_DIR, "data", "ml")
MODELS_DIR = os.path.join(AI_SERVICE_DIR, "models")
DB_DIR = os.path.join(AI_SERVICE_DIR, "data", "vector_db")

SIMILARITY_FEATURES_PATH = os.path.join(ML_DATA_DIR, "similarity_features.parquet")
HIDDEN_GEMS_PATH = os.path.join(ML_DATA_DIR, "hidden_gem_features.parquet")
SIMILARITY_SCALER_PATH = os.path.join(MODELS_DIR, "similarity_scaler.pkl")

# --- Logical Indices classes ---

class KnowledgeBaseIndex:
    def __init__(self, db_dir, embeddings):
        self.embeddings = embeddings
        self.db_dir = db_dir
        self.db = None
        self._load_index()

    def _load_index(self):
        from langchain_community.vectorstores import FAISS
        if not os.path.exists(self.db_dir):
            raise FileNotFoundError(f"Knowledge base index not found at {self.db_dir}")
        self.db = FAISS.load_local(self.db_dir, self.embeddings, allow_dangerous_deserialization=True)

    def search_dense(self, query: str, k: int = 20, metadata_filter: dict = None):
        return self.db.similarity_search(query, k=k, filter=metadata_filter)


class SemanticCacheIndex:
    def __init__(self, db_dir, embeddings, threshold=0.92):
        self.embeddings = embeddings
        self.threshold = threshold
        self.index_path = os.path.join(db_dir, "cache_faiss")
        self.sqlite_path = os.path.join(db_dir, "cache_store.db")
        self.db = None
        self._init_sqlite()
        self._init_faiss()

    def _init_sqlite(self):
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS responses (
                id TEXT PRIMARY KEY,
                query TEXT,
                response TEXT
            )
        """)
        conn.commit()
        conn.close()

    def _init_faiss(self):
        from langchain_community.vectorstores import FAISS
        if os.path.exists(self.index_path):
            self.db = FAISS.load_local(self.index_path, self.embeddings, allow_dangerous_deserialization=True)
        else:
            import faiss
            from langchain_community.docstore.in_memory import InMemoryDocstore
            dim = len(self.embeddings.embed_query("test"))
            index = faiss.IndexFlatL2(dim)
            self.db = FAISS(
                embedding_function=self.embeddings,
                index=index,
                docstore=InMemoryDocstore(),
                index_to_docstore_id={}
            )
            self.db.save_local(self.index_path)

    def check_cache(self, query: str) -> Optional[str]:
        # Search the FAISS index for closest query
        results = self.db.similarity_search_with_score(query, k=1)
        if not results:
            return None
            
        doc, distance = results[0]
        # Cosine similarity for normalized vectors: 1 - d^2 / 2
        similarity = 1.0 - (distance / 2.0)
        
        if similarity >= self.threshold:
            doc_id = doc.metadata.get("doc_id")
            if doc_id:
                conn = sqlite3.connect(self.sqlite_path)
                cursor = conn.cursor()
                cursor.execute("SELECT response FROM responses WHERE id = ?", (doc_id,))
                row = cursor.fetchone()
                conn.close()
                if row:
                    print(f"[Semantic Cache] HIT! Similarity={similarity:.4f} for query: '{query}' (cached: '{doc.page_content}')")
                    return row[0]
        return None

    def add_to_cache(self, query: str, response: str):
        from langchain_core.documents import Document
        doc_id = str(uuid.uuid4())
        
        # Save query to FAISS cache index
        doc = Document(page_content=query, metadata={"doc_id": doc_id})
        self.db.add_documents([doc])
        self.db.save_local(self.index_path)
        
        # Save response to SQLite
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO responses (id, query, response) VALUES (?, ?, ?)",
            (doc_id, query, response)
        )
        conn.commit()
        conn.close()
        print(f"[Semantic Cache] Cached query: '{query}'")


# --- Query Expansion & Pre-filtering Helper Functions ---

SYNONYM_MAP = {
    "counter-pressing (gegenpressing)": ["counter press", "counter pressing", "gegenpress", "gegenpressing", "klopp", "klopp style", "win ball back quickly"],
    "tiki-taka": ["short passing", "guardiola", "possession", "tiki taka", "triangles"],
    "catenaccio": ["deep defensive line", "libero", "sweeper", "defensive solidity"],
    "high press": ["pressing triggers", "high line", "forcing mistakes", "pressing high"],
    "low block": ["defensive compactness", "deep defending", "low-block"],
    "positional play (juego de posición)": ["juego de posición", "occupying zones", "positional advantages", "numerical superiority", "passing lanes", "blocks passing lanes", "blocked passing lanes"],
    "counter-attacking": ["direct transition", "rapid counter", "exploiting space"],
    "direct play": ["long balls", "long passes", "route one football", "aerial forwards"],
    "false nine": ["false striker", "dropping striker", "messi role"],
    "build-up from the back": ["playing out from defense", "short passes by goalie", "building from back", "passing corridors"],
    "switch of play": ["crossfield switch", "switching wings", "diagonal ball"],
    "third-man runs": ["third man", "third-man combinations", "third-man run", "up-back-through"],
    "build up vs high press": ["blocked passing lanes", "blocks the central passing lanes", "central passing lanes", "cutting off passing lanes"],
    "pressing shadows (cover shadows)": ["cover shadow", "pressing shadow", "passing lanes", "block passing lanes", "blocking passing lanes", "cutting off passing lanes"],
}

def expand_query(query: str) -> str:
    query_lower = query.lower()
    terms_to_add = set()
    for keyword, synonyms in SYNONYM_MAP.items():
        if keyword in query_lower or any(syn in query_lower for syn in synonyms):
            terms_to_add.add(keyword)
            for syn in synonyms:
                terms_to_add.add(syn)
                
    if terms_to_add:
        expanded_query = f"{query} {' '.join(terms_to_add)}"
        return expanded_query
    return query

def detect_metadata_filter(query: str) -> Optional[str]:
    """Detect the primary tactical phase of a query (for logging/boosting only, NOT hard filtering)."""
    query_lower = query.lower()
    
    defence_keywords = [
        "defence", "defensive", "low block", "catenaccio", "mid-block", 
        "high press", "pressing trigger", "pressing trap", "man-oriented", 
        "zonal press", "compactness", "cover shadow", "libero"
    ]
    attack_keywords = [
        "attack", "attacking", "tiki-taka", "tiki taka", "overload", "underload", 
        "overlapping", "underlapping", "false nine", "target man", "playmaker", 
        "pivot", "build-up", "building from the back", "wing-back", "juego de posicion"
    ]
    transition_keywords = [
        "transition", "gegenpress", "counter-press", "second ball", "counter-attack"
    ]
    
    has_transition = any(k in query_lower for k in transition_keywords)
    has_defence = any(k in query_lower for k in defence_keywords)
    has_attack = any(k in query_lower for k in attack_keywords)
    
    # Return detected phase as a soft signal (used for logging, NOT for hard FAISS filtering).
    # Hard pre-filtering was removed because it silently excluded cross-cutting documents
    # (e.g., case studies with phase='General') causing retrieval failures.
    if has_transition and not has_defence and not has_attack:
        return "Transition"
    elif has_defence and not has_transition and not has_attack:
        return "Defence"
    elif has_attack and not has_transition and not has_defence:
        return "Attack"
        
    return None

def run_rrf(bm25_docs, dense_docs, k=60, top_n=20):
    scores = {}
    def get_doc_key(doc):
        return doc.metadata.get("title", doc.page_content)
        
    for rank, doc in enumerate(bm25_docs, start=1):
        key = get_doc_key(doc)
        if key not in scores:
            scores[key] = {"doc": doc, "score": 0.0}
        scores[key]["score"] += 1.0 / (k + rank)
        
    for rank, doc in enumerate(dense_docs, start=1):
        key = get_doc_key(doc)
        if key not in scores:
            scores[key] = {"doc": doc, "score": 0.0}
        scores[key]["score"] += 1.0 / (k + rank)
        
    sorted_docs = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    return [item["doc"] for item in sorted_docs[:top_n]]

def run_mmr(query_emb, doc_embs, docs, top_k=8, lambda_val=0.5):
    if not docs:
        return []
    
    N = len(docs)
    query_emb = np.array(query_emb)
    doc_embs = np.array(doc_embs)
    
    query_emb = query_emb / np.linalg.norm(query_emb)
    norms = np.linalg.norm(doc_embs, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    doc_embs = doc_embs / norms
    
    query_sims = np.dot(doc_embs, query_emb)
    
    selected_indices = []
    unselected_indices = list(range(N))
    
    best_idx = int(np.argmax(query_sims))
    selected_indices.append(best_idx)
    unselected_indices.remove(best_idx)
    
    while len(selected_indices) < min(top_k, N):
        best_mmr_score = -1.0
        best_idx = -1
        
        selected_embs = doc_embs[selected_indices]
        
        for idx in unselected_indices:
            emb = doc_embs[idx]
            max_sim_to_selected = np.max(np.dot(selected_embs, emb))
            mmr_score = lambda_val * query_sims[idx] - (1 - lambda_val) * max_sim_to_selected
            
            if mmr_score > best_mmr_score:
                best_mmr_score = mmr_score
                best_idx = idx
                
        if best_idx == -1:
            break
            
        selected_indices.append(best_idx)
        unselected_indices.remove(best_idx)
        
    return [docs[idx] for idx in selected_indices]


TACTICAL_SYNTHESIS_PROMPT = """You are the Apex Tactical Advisor.
Answer the user's tactical question by synthesizing the retrieved evidence.
Do not summarize each retrieved document separately. Identify how the retrieved concepts interact and explain their tactical relationships.

For tactical decision/coaching queries:
- Identify the tactical objective.
- Explain the available player behaviors.
- Explain the conditions or cues that determine each behavior.
- Describe the coaching or training method.
- Explain the expected tactical outcome.
- Explain any risks or limitations.

For definition/comparison/general queries:
- Definition / Key Principles.
- Advantages and Weaknesses.
- Related Tactical Concepts.

Choose appropriate headings dynamically based on the user's intent. Do not include empty or weak sections merely to follow a fixed template.
Use the question's terminology naturally. Do not mention "the retrieved documents," "the context," or "the knowledge base."

Use the retrieved context to answer the user's query. While you must remain grounded in and supported by the retrieved concepts and principles, apply them constructively to address the user's specific scenario. Avoid stating that the database does not contain this information or giving empty/refusal disclaimers when you can logically apply the retrieved concepts (such as using third-man combinations, Positional Play spacing, rotations, wide switches, or dropping to receive) to provide a helpful tactical solution.

Retrieved Context:
{context}

Coverage Limitations (if any):
{limitations}"""


def run_with_retry(func, *args, max_retries=3, initial_delay=1.0, **kwargs):
    delay = initial_delay
    for attempt in range(max_retries + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            err_str = str(e)
            is_rate_limit = any(term in err_str for term in ["429", "ResourceExhausted", "Quota exceeded", "Resource exhausted", "rate limit"])
            if is_rate_limit and attempt < max_retries:
                print(f"[Rate Limit] Hit 429/Quota limit on attempt {attempt+1}. Retrying in {delay:.2f} seconds...")
                time.sleep(delay)
                delay *= 2.0
            else:
                raise e

def _classify_simple_query(query: str) -> Optional[dict]:
    query_clean = query.strip().lower()
    if query_clean.endswith("?"):
        query_clean = query_clean[:-1].strip()
        
    words = query_clean.split()
    if len(words) > 8:
        return None
        
    definition_starters = ["what is", "what are", "define", "explain", "describe", "who is", "who are", "meaning of"]
    is_def = any(query_clean.startswith(starter) for starter in definition_starters) or (len(words) <= 4)
    
    if is_def:
        concepts = _get_concept_keys()
            
        matched_concept = None
        for key in concepts:
            if key.lower() in query_clean:
                matched_concept = key
                break
                
        return {
            "query_type": "definition",
            "subqueries": [query],
            "required_concepts": [matched_concept] if matched_concept else [],
            "preferred_document_types": ["concept"]
        }
        
    return None


class AIService:
    def __init__(self):
        self._similarity_df = None
        self._knn_model = None
        self._hidden_gems_df = None
        self._embeddings = None
        self._kb_index = None
        self._cache_index = None
        self._bm25_retriever = None
        self._reranker = None
        self._llm = None

    def _get_llm(self):
        """Lazy-initialized singleton for the LLM client."""
        if self._llm is None:
            try:
                api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
                if api_key:
                    self._llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2, google_api_key=api_key)
                else:
                    self._llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)
            except Exception as e:
                print(f"[AIService Warning] Could not initialize ChatGoogleGenerativeAI: {e}")
                return None
        return self._llm

    def warmup(self):
        """Pre-load models at startup. On Render/memory-constrained environments, only load LLM to prevent OOM."""
        print("[AIService] Warming up models...")
        t0 = time.time()
        try:
            self._get_llm()
        except Exception as e:
            print(f"[AIService Warning] LLM warmup skipped: {e}")
        
        # Detect if we are on Render (Free tier memory constraints)
        is_render = os.environ.get("RENDER") == "true"
        if not is_render:
            try:
                self._get_embeddings()
                self._get_kb_index()
                self._get_bm25_retriever()
                self._get_reranker()
                self._get_cache_index()
            except Exception as e:
                print(f"[AIService] Non-critical error during heavy model warmup: {e}")
        else:
            print("[AIService] Render environment detected. Skipping heavy model warmup to prevent OOM (Out Of Memory) limits.")
            
        elapsed = (time.time() - t0) * 1000
        print(f"[AIService] Warmup complete in {elapsed:.0f}ms.")

    def _get_similarity_model(self):
        if self._similarity_df is None:
            import pandas as pd
            from sklearn.neighbors import NearestNeighbors
            
            if not os.path.exists(SIMILARITY_FEATURES_PATH):
                raise FileNotFoundError("Similarity features not found.")
            
            self._similarity_df = pd.read_parquet(SIMILARITY_FEATURES_PATH)
            feature_cols = [c for c in self._similarity_df.columns if c not in ['snapshot_id', 'player_id']]
            X = self._similarity_df[feature_cols].values
            
            self._knn_model = NearestNeighbors(n_neighbors=20, metric='euclidean')
            self._knn_model.fit(X)
            
        return self._similarity_df, self._knn_model

    def _get_hidden_gems_data(self):
        if self._hidden_gems_df is None:
            import pandas as pd
            if not os.path.exists(HIDDEN_GEMS_PATH):
                raise FileNotFoundError("Hidden gem features not found.")
            self._hidden_gems_df = pd.read_parquet(HIDDEN_GEMS_PATH)
        return self._hidden_gems_df

    def _get_embeddings(self):
        if self._embeddings is None:
            api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
            
            if api_key:
                try:
                    from langchain_google_genai import GoogleGenerativeAIEmbeddings
                    print("[AIService] Using lightweight Google Gemini Embeddings (0 MB local RAM usage)...")
                    self._embeddings = GoogleGenerativeAIEmbeddings(
                        model="models/text-embedding-004",
                        google_api_key=api_key
                    )
                    return self._embeddings
                except Exception as e:
                    print(f"[AIService Warning] Could not initialize GoogleGenerativeAIEmbeddings: {e}")

            # Fallback to HuggingFace Embeddings if no Gemini key
            try:
                from langchain_community.embeddings import HuggingFaceEmbeddings
                self._embeddings = HuggingFaceEmbeddings(
                    model_name="BAAI/bge-small-en-v1.5",
                    model_kwargs={"device": "cpu"}
                )
            except Exception as e:
                print(f"[AIService Warning] HuggingFaceEmbeddings fallback: {e}")
                self._embeddings = None
        return self._embeddings

    def _get_kb_index(self):
        if self._kb_index is None:
            emb = self._get_embeddings()
            if emb is None:
                return None
            self._kb_index = KnowledgeBaseIndex(DB_DIR, emb)
        return self._kb_index

    def _get_cache_index(self):
        if self._cache_index is None:
            emb = self._get_embeddings()
            if emb is None:
                return None
            self._cache_index = SemanticCacheIndex(DB_DIR, emb)
        return self._cache_index

    def _get_bm25_retriever(self):
        if self._bm25_retriever is None:
            kb = self._get_kb_index()
            if not kb or not kb.db:
                return None
            docs = list(kb.db.docstore._dict.values())
            from langchain_community.retrievers import BM25Retriever
            self._bm25_retriever = BM25Retriever.from_documents(docs)
        return self._bm25_retriever

    def _get_reranker(self):
        if self._reranker is None:
            is_render = os.environ.get("RENDER", "").lower() in ("true", "1", "yes")
            if is_render or os.environ.get("DISABLE_HEAVY_RERANKER") == "true":
                print("[AIService] Reranker disabled on Render to save memory.")
                return None
            try:
                from sentence_transformers import CrossEncoder
                self._reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", local_files_only=True)
            except Exception as e:
                print(f"[AIService] Error loading CrossEncoder: {e}. Reranking will be bypassed.")
                return None
        return self._reranker

    def _analyze_query(self, query: str) -> dict:
        query_clean = query.strip().lower()
        if query_clean.endswith("?"):
            query_clean = query_clean[:-1].strip()
            
        words = query_clean.split()
        
        # 1. Local Rule-Based Intent Classification
        drill_words = ["drill", "train", "exercise", "rondo", "practice", "coaching point", "session", "game", "methods for"]
        comparison_words = ["vs", "versus", "against", "difference", "compare", "comparison", "contrast", "options"]
        role_words = ["role", "position", "playmaker", "winger", "full-back", "striker", "libero", "goalkeeper", "defender", "midfielder", "centre-back", "keeper"]
        interaction_words = ["how do", "how should", "what should", "should", "how to", "manipulate", "balance", "interaction", "relationship", "trigger", "transition", "do when", "does when"]
        definition_starters = ["what is", "what are", "define", "explain", "describe", "who is", "who are", "meaning of"]
        
        query_type = "tactical_interaction"
        preferred_doc_types = ["concept", "tactical_pattern"]
        
        if any(w in query_clean for w in drill_words):
            query_type = "training_drill"
            preferred_doc_types = ["training_drill", "tactical_pattern"]
        elif any(w in query_clean for w in comparison_words):
            query_type = "comparison"
            preferred_doc_types = ["concept", "team_interaction"]
        elif any(w in query_clean for w in role_words) and not any(w in query_clean for w in interaction_words):
            query_type = "player_role"
            preferred_doc_types = ["concept", "tactical_pattern"]
        elif any(query_clean.startswith(starter) for starter in definition_starters) or len(words) <= 5:
            query_type = "definition"
            preferred_doc_types = ["concept"]
        
        # 2. Local Tactical Concept Matching
        concepts = _get_concept_keys()
            
        required_concepts = []
        for key in concepts:
            key_clean = key.lower()
            # 1. Match exact key in query
            if key_clean in query_clean:
                required_concepts.append(key)
                continue
            
            # 2. Match via brackets decomposition (e.g. Counter-Pressing (Gegenpressing))
            if "(" in key_clean:
                parts = key_clean.replace("(", "").replace(")", "").split()
                if any(p in query_clean for p in parts if len(p) > 4):
                    required_concepts.append(key)
                    continue
            
            # 3. Match via local synonym list
            synonyms = SYNONYM_MAP.get(key_clean, [])
            if any(syn in query_clean for syn in synonyms):
                required_concepts.append(key)
                
        # 3. Formulate subqueries (local lexical decomposition)
        subqueries = [query]
        matched_roles = [w for w in role_words if w in query_clean]
        if matched_roles and "transition" in query_clean:
            subqueries.append(f"{matched_roles[0]} winger full-back transition movements")
        if required_concepts:
            subqueries.append(f"{required_concepts[0]} training drill and execution")
            
        print(f"[Query Analyzer] Local Classifier matched query: '{query}' | Intent: '{query_type}' | Concepts: {required_concepts}")
        
        return {
            "query_type": query_type,
            "subqueries": subqueries,
            "required_concepts": required_concepts,
            "preferred_document_types": preferred_doc_types
        }

    def _get_db_fallback_hidden_gems(self, db: Session, limit: int = 20, matching_ids: set | None = None):
        """Fallback method when ML parquet files are missing or unreadable on Render."""
        query = db.query(Player).filter(Player.is_active == True)
        if matching_ids:
            query = query.filter(Player.fifa_id.in_(matching_ids))
        else:
            query = query.filter(
                Player.age <= 25,
                Player.potential >= 75,
                Player.potential > Player.overall
            )
            
        players = query.order_by((Player.potential - Player.overall).desc(), Player.potential.desc()).limit(limit * 3).all()
        results = []
        for p in players:
            val = float(p.value_eur or 1000000.0)
            pot_gap = max(1, (p.potential or 75) - (p.overall or 65))
            predicted_val = round(val * (1.0 + (pot_gap * 0.15)), 2)
            gap = round(predicted_val - val, 2)
            score = round(min(99.0, max(50.0, 70.0 + (pot_gap * 3.5) + ((26 - (p.age or 20)) * 1.2))), 1)
            
            results.append({
                "fifa_id": p.fifa_id,
                "name": p.name,
                "age": p.age or 20,
                "overall": p.overall or 70,
                "potential": p.potential or 80,
                "value_eur": p.value_eur,
                "wage_eur": p.wage_eur,
                "predicted_value_eur": predicted_val,
                "undervaluation_gap": gap,
                "hidden_gem_score": score
            })
            if len(results) >= limit:
                break
        return results

    def _get_db_fallback_similar_players(self, db: Session, fifa_id: int, k: int = 5):
        """Zero-RAM SQL-based similarity fallback using player attribute vectors."""
        target = db.query(Player).filter(Player.fifa_id == fifa_id).first()
        if not target:
            return None
            
        candidates = db.query(Player).filter(
            Player.fifa_id != fifa_id,
            Player.is_active == True,
            Player.overall >= max(40, (target.overall or 70) - 12),
            Player.overall <= min(99, (target.overall or 70) + 12)
        ).limit(120).all()
        
        scored = []
        for p in candidates:
            pace_diff = (p.pace or 70) - (target.pace or 70)
            shoot_diff = (p.shooting or 70) - (target.shooting or 70)
            pass_diff = (p.passing or 70) - (target.passing or 70)
            drib_diff = (p.dribbling or 70) - (target.dribbling or 70)
            def_diff = (p.defending or 70) - (target.defending or 70)
            phys_diff = (p.physical or 70) - (target.physical or 70)
            ovr_diff = (p.overall or 70) - (target.overall or 70)
            
            dist = (pace_diff**2 + shoot_diff**2 + pass_diff**2 + drib_diff**2 + def_diff**2 + phys_diff**2 + ovr_diff**2 * 2) ** 0.5
            sim_score = max(50.0, round(100.0 - (dist * 0.8), 1))
            
            scored.append({
                "fifa_id": p.fifa_id,
                "name": p.name,
                "overall": p.overall,
                "position": p.position,
                "club": p.club,
                "similarity_score": sim_score,
                "age": p.age,
                "potential": p.potential,
                "preferred_foot": p.preferred_foot,
                "value_eur": p.value_eur,
                "wage_eur": p.wage_eur,
                "nationality": p.nationality,
                "face_url": p.face_url,
                "club_logo": p.club_logo,
                "nation_flag": p.nation_flag
            })
            
        scored.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored[:k]

    def get_similar_players(self, db: Session, fifa_id: int, k: int = 5):
        is_render = os.environ.get("RENDER", "").lower() in ("true", "1", "yes")
        if is_render or os.environ.get("USE_DB_SIMILARITY") == "true":
            return self._get_db_fallback_similar_players(db=db, fifa_id=fifa_id, k=k)

        try:
            df, knn = self._get_similarity_model()
        except Exception as e:
            print(f"[AIService Warning] Could not load similarity model: {e}. Using DB fallback.")
            return self._get_db_fallback_similar_players(db=db, fifa_id=fifa_id, k=k)

        target_row = df[df['player_id'] == fifa_id]
        if target_row.empty:
            return self._get_db_fallback_similar_players(db=db, fifa_id=fifa_id, k=k)
            
        target_idx = target_row.index[0]
        feature_cols = [c for c in df.columns if c not in ['snapshot_id', 'player_id']]
        target_features = df.iloc[target_idx][feature_cols].values.reshape(1, -1)
        
        fetch_k = min(k * 10, len(df))
        distances, indices = knn.kneighbors(target_features, n_neighbors=fetch_k)
        
        seen_fifa_ids = {fifa_id}
        candidate_ids = []
        dist_map = {}
        
        for i in range(1, len(indices[0])):
            idx = indices[0][i]
            dist = distances[0][i]
            sim_fifa_id = int(df.iloc[idx]['player_id'])
            
            if sim_fifa_id in seen_fifa_ids:
                continue
                
            seen_fifa_ids.add(sim_fifa_id)
            candidate_ids.append(sim_fifa_id)
            dist_map[sim_fifa_id] = dist
            if len(candidate_ids) >= k * 4:
                break

        if not candidate_ids:
            return self._get_db_fallback_similar_players(db=db, fifa_id=fifa_id, k=k)

        # Batch query all candidate players in ONE query to prevent N+1 performance issues
        db_players = db.query(Player).filter(Player.fifa_id.in_(candidate_ids)).all()
        player_map = {p.fifa_id: p for p in db_players}
        
        similar_players = []
        for sim_fifa_id in candidate_ids:
            db_player = player_map.get(sim_fifa_id)
            if db_player:
                dist = dist_map[sim_fifa_id]
                sim_score = max(0, 100 - (dist * 2)) 
                similar_players.append({
                    "fifa_id": db_player.fifa_id,
                    "name": db_player.name,
                    "overall": db_player.overall,
                    "position": db_player.position,
                    "club": db_player.club,
                    "similarity_score": round(sim_score, 1),
                    "age": db_player.age,
                    "potential": db_player.potential,
                    "preferred_foot": db_player.preferred_foot,
                    "value_eur": db_player.value_eur,
                    "wage_eur": db_player.wage_eur,
                    "nationality": db_player.nationality,
                    "face_url": db_player.face_url,
                    "club_logo": db_player.club_logo,
                    "nation_flag": db_player.nation_flag
                })
                if len(similar_players) >= k:
                    break
                
        return similar_players or self._get_db_fallback_similar_players(db=db, fifa_id=fifa_id, k=k)

    def get_top_hidden_gems(
        self,
        db: Session,
        limit: int = 20,
        search: str | None = None,
        league: str | None = None,
        nationality: str | None = None,
        position: str | None = None,
        min_overall: int | None = None,
        min_age: int | None = None,
        max_age: int | None = None,
        min_potential: int | None = None,
        min_height: int | None = None,
        min_weight: int | None = None,
        max_market_value: float | None = None,
        min_xg: float | None = None,
        min_goals: int | None = None,
        min_pass_accuracy: int | None = None,
        min_progressive_passes: float | None = None,
        foot: str | None = None,
    ):
        from sqlalchemy import or_
        has_filters = any([
            search, league, nationality, position, min_overall, min_age, max_age,
            min_potential, min_height, min_weight, max_market_value is not None,
            min_xg is not None, min_goals is not None, min_pass_accuracy,
            min_progressive_passes is not None, foot
        ])
        
        matching_ids = None
        if has_filters:
            query = db.query(Player.fifa_id)
            if search:
                query = query.filter(
                    or_(
                        Player.name.ilike(f"%{search}%"),
                        Player.club.ilike(f"%{search}%"),
                        Player.nationality.ilike(f"%{search}%")
                    )
                )
            if league:
                query = query.filter(Player.league == league)
            if nationality:
                query = query.filter(Player.nationality == nationality)
            if position:
                query = query.filter(Player.position.ilike(f"%{position}%"))
            if min_overall:
                query = query.filter(Player.overall >= min_overall)
            if min_age:
                query = query.filter(Player.age >= min_age)
            if max_age:
                query = query.filter(Player.age <= max_age)
            if min_potential:
                query = query.filter(Player.potential >= min_potential)
            if min_height:
                query = query.filter(Player.height_cm >= min_height)
            if min_weight:
                query = query.filter(Player.weight_kg >= min_weight)
            if max_market_value is not None:
                query = query.filter(Player.value_eur <= max_market_value)
            if min_xg is not None:
                query = query.filter(or_(Player.xg >= min_xg, Player.xg.is_(None)))
            if min_goals is not None:
                query = query.filter(or_(Player.goals >= min_goals, Player.goals.is_(None)))
            if min_pass_accuracy:
                query = query.filter(or_(Player.passing >= min_pass_accuracy, Player.passing.is_(None)))
            if min_progressive_passes is not None:
                query = query.filter(or_(Player.progressive_passes >= min_progressive_passes, Player.progressive_passes.is_(None)))
            if foot:
                query = query.filter(Player.preferred_foot == foot)
                
            matching_ids = {r[0] for r in query.all()}
            if not matching_ids:
                return self._get_db_fallback_hidden_gems(db=db, limit=limit)

        is_render = os.environ.get("RENDER", "").lower() in ("true", "1", "yes")
        if is_render or os.environ.get("USE_DB_HIDDEN_GEMS") == "true":
            return self._get_db_fallback_hidden_gems(db=db, limit=limit, matching_ids=matching_ids)

        try:
            df = self._get_hidden_gems_data()
        except Exception as e:
            print(f"[AIService Warning] Could not load hidden gems ML features ({e}). Using DB fallback.")
            return self._get_db_fallback_hidden_gems(db=db, limit=limit, matching_ids=matching_ids)

        top_gems = df.sort_values('hidden_gem_score', ascending=False)
        
        candidate_rows = []
        candidate_ids = []
        seen_fifa_ids = set()
        
        for _, row in top_gems.iterrows():
            sim_fifa_id = int(row['player_id'])
            if sim_fifa_id in seen_fifa_ids:
                continue
            if matching_ids is not None and sim_fifa_id not in matching_ids:
                continue
                
            seen_fifa_ids.add(sim_fifa_id)
            candidate_rows.append(row)
            candidate_ids.append(sim_fifa_id)
            if len(candidate_ids) >= limit * 5:
                break

        if not candidate_ids:
            return self._get_db_fallback_hidden_gems(db=db, limit=limit, matching_ids=matching_ids)

        # Batch query all candidate players in ONE query
        db_players = db.query(Player).filter(Player.fifa_id.in_(candidate_ids)).all()
        player_map = {p.fifa_id: p for p in db_players}

        results = []
        for row in candidate_rows:
            sim_fifa_id = int(row['player_id'])
            db_player = player_map.get(sim_fifa_id)
            if db_player:
                results.append({
                    "fifa_id": db_player.fifa_id,
                    "name": db_player.name,
                    "age": db_player.age,
                    "overall": db_player.overall,
                    "potential": db_player.potential,
                    "value_eur": db_player.value_eur,
                    "wage_eur": db_player.wage_eur,
                    "predicted_value_eur": float(row['predicted_value_eur']),
                    "undervaluation_gap": float(row['undervaluation_gap']),
                    "hidden_gem_score": float(row['hidden_gem_score'])
                })
                
            if len(results) >= limit:
                break

        if not results:
            return self._get_db_fallback_hidden_gems(db=db, limit=limit, matching_ids=matching_ids)

        return results

    def query_tactical_advisor_stream(self, query: str) -> Generator[str, None, None]:
        start_time = time.time()
        
        try:
            # 1. Query Expansion (Synonyms)
            expanded_query = expand_query(query)
            
            # 2. Semantic Cache Check
            cache = None
            try:
                cache = self._get_cache_index()
                if cache:
                    cached_response = cache.check_cache(query)
                    if cached_response and cached_response.strip():
                        print(f"\n[Semantic Cache] HIT for query: '{query}'")
                        yield cached_response
                        return
            except Exception as cache_err:
                print(f"[AIService Warning] Cache lookup failed: {cache_err}")

            # 3. Cache Miss - Query Understanding & Retrieval
            retrieval_start = time.time()
            
            # Analyze user query
            analysis = self._analyze_query(query)
            query_type = analysis.get("query_type", "tactical_interaction")
            subqueries = analysis.get("subqueries", [query])
            required_concepts = analysis.get("required_concepts", [])
            preferred_doc_types = analysis.get("preferred_document_types", [])
            
            metadata_filter = detect_metadata_filter(query)
            
            dense_docs = []
            try:
                kb_index = self._get_kb_index()
                if kb_index and kb_index.db:
                    dense_docs = kb_index.search_dense(expanded_query, k=20)
            except Exception as dense_err:
                print(f"[AIService Warning] Dense retrieval failed: {dense_err}")

            rrf_scores = {}
            k_val = 60
            
            try:
                bm25_retriever = self._get_bm25_retriever()
                if bm25_retriever:
                    for sub_q in subqueries:
                        expanded_sub_q = expand_query(sub_q)
                        sub_bm25_docs = bm25_retriever.invoke(expanded_sub_q)[:10]
                        for rank, doc in enumerate(sub_bm25_docs, start=1):
                            title = doc.metadata.get("title")
                            if not title:
                                continue
                            if title not in rrf_scores:
                                rrf_scores[title] = {"doc": doc, "score": 0.0}
                            rrf_scores[title]["score"] += 1.0 / (k_val + rank)
            except Exception as bm25_err:
                print(f"[AIService Warning] BM25 retrieval failed: {bm25_err}")

            # Aggregate Dense ranks
            for rank, doc in enumerate(dense_docs, start=1):
                title = doc.metadata.get("title")
                if not title:
                    continue
                if title not in rrf_scores:
                    rrf_scores[title] = {"doc": doc, "score": 0.0}
                rrf_scores[title]["score"] += 1.0 / (k_val + rank)
                    
            fused_docs = [item["doc"] for item in sorted(rrf_scores.values(), key=lambda x: x["score"], reverse=True)][:20]
            diverse_docs = fused_docs
            
            # Fast Reranking using ms-marco CrossEncoder
            decomposed_query_comb = f"{query} {' '.join(subqueries)}"
            rerank_docs = diverse_docs[:6]
            if rerank_docs:
                reranker = self._get_reranker()
                if reranker is not None:
                    try:
                        pairs = [[decomposed_query_comb, doc.page_content] for doc in rerank_docs]
                        scores = reranker.predict(pairs)
                        scored_docs = sorted(zip(rerank_docs, scores), key=lambda x: x[1], reverse=True)
                        top_docs = [doc for doc, score in scored_docs] + diverse_docs[6:]
                    except Exception as e:
                        print(f"[AIService] Error running reranker: {e}. Bypassing reranking.")
                        top_docs = diverse_docs
                else:
                    top_docs = diverse_docs
            else:
                top_docs = diverse_docs
                
            if query_type == "definition":
                final_k = 2
            elif query_type == "comparison":
                final_k = 4
            elif query_type in ["tactical_interaction", "coaching_method", "training_drill"]:
                final_k = 5
            else:
                final_k = 3
                
            final_top_docs = top_docs[:final_k]
            
            # Evidence Coverage Checking
            retrieved_titles = {doc.metadata.get("title") for doc in final_top_docs}
            retrieved_related = set()
            for doc in final_top_docs:
                for rc in doc.metadata.get("related_concepts", []):
                    retrieved_related.add(rc)
                    
            missing_concepts = []
            for req in required_concepts:
                if req not in retrieved_titles and req not in retrieved_related:
                    if not any(req.lower() in t.lower() for t in retrieved_titles) and not any(req.lower() in r.lower() for r in retrieved_related):
                        missing_concepts.append(req)
                        
            limitations_context = ""
            if missing_concepts:
                limitations_context = f"The following required tactical topics were NOT found in the retrieved database context: {', '.join(missing_concepts)}. Acknowledge this limitation naturally at the end of the response."

            # Assemble Context
            context_parts = []
            for doc in final_top_docs:
                context_parts.append(
                    f"### Concept: {doc.metadata.get('title')}\n"
                    f"Document Type: {doc.metadata.get('document_type')}\n"
                    f"Category: {doc.metadata.get('category')}\n"
                    f"Phase: {doc.metadata.get('phase')}\n"
                    f"Description: {doc.page_content}"
                )
            context = "\n\n".join(context_parts)
            
            # LLM Call
            llm = self._get_llm()
            if not llm:
                yield "The AI Tactical Advisor LLM is currently unavailable. Please verify API key configuration."
                return

            prompt = ChatPromptTemplate.from_messages([
                ("system", TACTICAL_SYNTHESIS_PROMPT),
                ("human", "{query}")
            ])
            chain = prompt | llm
            
            full_response = ""
            for chunk in chain.stream({
                "context": context, 
                "limitations": limitations_context,
                "query": query
            }):
                text_chunk = getattr(chunk, "content", str(chunk))
                if text_chunk:
                    yield text_chunk
                    full_response += text_chunk
                    
            if cache and full_response.strip():
                try:
                    cache.add_to_cache(query, full_response)
                except Exception as c_err:
                    print(f"[AIService Warning] Failed adding response to cache: {c_err}")
                    
        except Exception as e:
            print(f"[AIService Error in query_tactical_advisor_stream]: {e}")
            import traceback
            traceback.print_exc()
            yield "The Tactical Advisor encountered an issue reading its database. Please try asking your question again."

    def query_tactical_advisor(self, query: str) -> str:
        # Non-streaming helper
        chunks = []
        for chunk in self.query_tactical_advisor_stream(query):
            chunks.append(chunk)
        return "".join(chunks)

ai_service = AIService()
