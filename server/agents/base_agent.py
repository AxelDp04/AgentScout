from abc import ABC, abstractmethod
from typing import Dict, Any, List
from pydantic import BaseModel

class AgentResult(BaseModel):
    success: bool
    data: Dict[str, Any] = {}
    errors: List[str] = []
    metadata: Dict[str, Any] = {}

class BaseAgent(ABC):
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    async def execute(self, query: str, **kwargs) -> AgentResult:
        """
        Ejecuta la tarea del agente
        """
        pass
    
    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """
        Retorna las capacidades del agente
        """
        pass
