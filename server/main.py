from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AgentScout API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MarketResearchRequest(BaseModel):
    query: str
    depth: Optional[str] = "standard"

class MarketResearchResponse(BaseModel):
    status: str
    data: Optional[dict] = None
    message: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "AgentScout API is running"}

@app.get("/test")
async def test_route():
    return {"status": "ok"}

@app.post("/api/research", response_model=MarketResearchResponse)
async def market_research(request: MarketResearchRequest):
    """
    Endpoint para iniciar investigación de mercado
    """
    try:
        # Importar el ResearchAgent
        from agents.researcher import ResearchAgent
        
        # Crear instancia del agente
        agent = ResearchAgent()
        
        # Ejecutar la investigación
        result = await agent.execute(request.query)
        
        if result.success:
            return MarketResearchResponse(
                status="success",
                data=result.data,
                message="Investigación completada exitosamente"
            )
        else:
            return MarketResearchResponse(
                status="error",
                message=f"Error en la investigación: {'; '.join(result.errors)}"
            )
            
    except Exception as e:
        return MarketResearchResponse(
            status="error",
            message=f"Error al procesar la solicitud: {str(e)}"
        )

@app.get("/api/agents")
async def list_agents():
    """
    Lista los agentes disponibles
    """
    agents = [
        {"id": "web_scraper", "name": "Web Scraper", "description": "Extrae información de sitios web"},
        {"id": "search_analyzer", "name": "Search Analyzer", "description": "Analiza resultados de búsqueda"},
        {"id": "trend_detector", "name": "Trend Detector", "description": "Detecta tendencias del mercado"}
    ]
    return {"agents": agents}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
