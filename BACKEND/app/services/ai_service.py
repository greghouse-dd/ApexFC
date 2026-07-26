import os
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

from app.models.player import Player

# Absolute paths to the ai-service directory
AI_SERVICE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "ai-service")
ML_DATA_DIR = os.path.join(AI_SERVICE_DIR, "data", "ml")
MODELS_DIR = os.path.join(AI_SERVICE_DIR, "models")
DB_DIR = os.path.join(AI_SERVICE_DIR, "data", "vector_db")

SIMILARITY_FEATURES_PATH = os.path.join(ML_DATA_DIR, "similarity_features.parquet")
HIDDEN_GEMS_PATH = os.path.join(ML_DATA_DIR, "hidden_gem_features.parquet")
SIMILARITY_SCALER_PATH = os.path.join(MODELS_DIR, "similarity_scaler.pkl")

class AIService:
    def __init__(self):
        self._similarity_df = None
        self._knn_model = None
        self._hidden_gems_df = None
        self._vector_db = None
        
        # We will load these lazily to avoid slowing down API startup, 
        # or we could load them here in __init__ if we want them ready immediately.
        # For a robust API, loading large models globally is better done on startup event, 
        # but for simplicity, we'll do it on first use (lazy loading).

    def _get_similarity_model(self):
        if self._similarity_df is None:
            import pandas as pd
            from sklearn.neighbors import NearestNeighbors
            
            if not os.path.exists(SIMILARITY_FEATURES_PATH):
                raise FileNotFoundError("Similarity features not found.")
            
            # Load Data
            self._similarity_df = pd.read_parquet(SIMILARITY_FEATURES_PATH)
            
            # Features are all columns except snapshot_id and player_id
            feature_cols = [c for c in self._similarity_df.columns if c not in ['snapshot_id', 'player_id']]
            X = self._similarity_df[feature_cols].values
            
            # Fit KNN
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

    def _get_vector_db(self):
        if self._vector_db is None:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            from langchain_community.vectorstores import Chroma
            
            embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            self._vector_db = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
        return self._vector_db

    def get_similar_players(self, db: Session, fifa_id: int, k: int = 5):
        df, knn = self._get_similarity_model()
        
        # Find the target player's index in the parquet file
        # player_id maps to fifa_id
        target_row = df[df['player_id'] == fifa_id]
        if target_row.empty:
            return None # Player not found in ML features
            
        target_idx = target_row.index[0]
        
        feature_cols = [c for c in df.columns if c not in ['snapshot_id', 'player_id']]
        target_features = df.iloc[target_idx][feature_cols].values.reshape(1, -1)
        
        # Request more neighbors to filter out duplicates across versions
        fetch_k = min(k * 10, len(df))
        distances, indices = knn.kneighbors(target_features, n_neighbors=fetch_k)
        
        similar_players = []
        seen_fifa_ids = {fifa_id} # Add target player to skip themselves
        
        for i in range(1, len(indices[0])): # Skip index 0
            idx = indices[0][i]
            dist = distances[0][i]
            
            sim_fifa_id = int(df.iloc[idx]['player_id'])
            
            if sim_fifa_id in seen_fifa_ids:
                continue
                
            seen_fifa_ids.add(sim_fifa_id)
            
            # Fetch from SQLite
            db_player = db.query(Player).filter(Player.fifa_id == sim_fifa_id).first()
            if db_player:
                # Convert distance to a similarity score (0 to 100)
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
                
        return similar_players

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
        
        # Check if we have active filters
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
                query = query.filter(Player.xg >= min_xg)
            if min_goals is not None:
                query = query.filter(Player.goals >= min_goals)
            if min_pass_accuracy:
                query = query.filter(Player.passing >= min_pass_accuracy)
            if min_progressive_passes is not None:
                query = query.filter(Player.progressive_passes >= min_progressive_passes)
            if foot:
                query = query.filter(Player.preferred_foot == foot)
                
            matching_ids = {r[0] for r in query.all()}
            if not matching_ids:
                return []

        df = self._get_hidden_gems_data()
        
        # Sort by hidden gem score
        top_gems = df.sort_values('hidden_gem_score', ascending=False)
        
        results = []
        seen_fifa_ids = set()
        
        for _, row in top_gems.iterrows():
            sim_fifa_id = int(row['player_id'])
            
            if sim_fifa_id in seen_fifa_ids:
                continue
                
            if matching_ids is not None and sim_fifa_id not in matching_ids:
                continue
                
            seen_fifa_ids.add(sim_fifa_id)
            
            # Fetch from SQLite
            db_player = db.query(Player).filter(Player.fifa_id == sim_fifa_id).first()
            if db_player:
                results.append({
                    "fifa_id": db_player.fifa_id,
                    "name": db_player.name,
                    "age": db_player.age,
                    "overall": db_player.overall,
                    "potential": db_player.potential,
                    "value_eur": db_player.value_eur,
                    "wage_eur": db_player.wage_eur,
                    "predicted_value_eur": row['predicted_value_eur'],
                    "undervaluation_gap": row['undervaluation_gap'],
                    "hidden_gem_score": row['hidden_gem_score']
                })
                
            if len(results) >= limit:
                break
                
        return results

    def query_tactical_advisor(self, query: str):
        vectordb = self._get_vector_db()
        results = vectordb.similarity_search(query, k=3)
        
        if not results:
            return "I couldn't find any tactical information related to that."
            
        # Combine the context of top 3 matches
        context = "\n\n".join([doc.page_content for doc in results])
        
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.prompts import ChatPromptTemplate
            
            llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an elite football tactical advisor. Use the following context to answer the coach's tactical question. Be professional, clear, and analytical. Do not use outside knowledge if the answer is completely missing from the context, but you may synthesize the context naturally.\n\nContext:\n{context}"),
                ("human", "{query}")
            ])
            
            chain = prompt | llm
            response = chain.invoke({"context": context, "query": query})
            return response.content
            
        except Exception as e:
            # Fallback to pure RAG if API key is missing or fails
            return f"[LLM ERROR: {str(e)}] \n\nRaw Context:\n{context}"

ai_service = AIService()
