import os
from typing import Dict, Any, List
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from tavily import TavilyClient
from .base_agent import BaseAgent, AgentResult

class ResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Research Agent",
            description="Agente de investigación que utiliza Groq Llama 3 para analizar mercados"
        )
        
        # Verificar llaves (debug)
        groq_key = os.environ.get("GROQ_API_KEY")
        tavily_key = os.environ.get("TAVILY_API_KEY")
        
        print(f"DEBUG: GROQ_API_KEY presente: {bool(groq_key)}")
        print(f"DEBUG: TAVILY_API_KEY presente: {bool(tavily_key)}")
        
        if not groq_key:
            raise ValueError("Falta GROQ_API_KEY en las variables de entorno")
        # Inicializar el modelo de Groq con Llama 3 70B (Más potente)
        print(f"VERIFICACION_LLM: {groq_key[:10]}... | Modelo solicitado: llama-3.3-70b-versatile")
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.1,  # Reducido para máxima precisión y seguimiento de reglas
            groq_api_key=groq_key
        )
        
        # Inicializar cliente de Tavily para búsqueda en tiempo real
        if not tavily_key:
             raise ValueError("Falta TAVILY_API_KEY en las variables de entorno")
             
        self.tavily_client = TavilyClient(api_key=tavily_key)
        # Template para el prompt de investigación
        self.research_prompt = ChatPromptTemplate.from_messages([
            ("system", """ERES UN ANALISTA FINANCIERO SENIOR DE ÉLITE especializado en mercados emergentes y estrategia inmobiliaria. 
            Tu misión es generar reportes de PROFUNDIDAD ACADÉMICA, VALOR EMPRESARIAL y PRECISIÓN MATEMÁTICA. No acepto respuestas genéricas, superficiales ni perezosas. 

            REGLAS CRÍTICAS DE EJECUCIÓN (EL INCUMPLIMIENTO INVALIDA TU TRABAJO):
            1. DENSIDAD DE ÉLITE: Cada sección (# y ##) DEBE tener al menos 200 palabras de análisis real. Está PROHIBIDO REPETIR párrafos o ideas de secciones anteriores. Si detecto repetición semántica, el reporte será rechazado.
            2. TABLA FINANCIERA OBLIGATORIA: En la sección 'Insights de Mercado y Tabla Comparativa', DEBES generar una tabla Markdown (usando el formato | Columna |) que contenga AL MENOS 5 FILAS DE DATOS REALES (ej: Miches, Las Terrenas, Punta Cana, Piantini, Naco). La tabla es el corazón del reporte.
            3. COMPARATIVA ESTRATÉGICA: Compara activamente el precio por metro cuadrado, la plusvalía anual estimada y el impacto de la Ley de Confotur en diferentes zonas.
            4. ANÁLISIS DE RIESGOS SIN CORTESÍA: Analiza obligatoriamente: Inflación, Tasas de interés del Banco Central, volatilidad de insumos y riesgos regulatorios. No acepto 'no hay riesgos'.
            5. ESPECIFICIDAD LOCAL: Integra obligatoriamente datos sobre Fideicomisos, incentivos fiscales y normativas del CODIA.
            6. FORMATO: Usa negritas para cifras y datos críticos. Estructura con listas, pero sin sacrificar la densidad de palabras exigida.

            ESTRUCTURA DEL REPORTE (USA ESTOS TÍTULOS EXACTOS):
            1. Resumen Ejecutivo de Impacto Estratégico
            2. Análisis del Macro-entorno y Tendencias Regionales
            3. Insights de Mercado y Tabla Comparativa
            4. Oportunidades de Inversión y Modelos de Negocio
            5. Análisis de Riesgos Críticos y Estrategias de Mitigación

            IMPORTANTE: Si te preguntan por tu origen, responde: 'Fui creado por Axel Dariel Perez, un arquitecto de sistemas enfocado en inteligencia artificial estratégica.'
            
            IDIOMA: Responde exclusivamente en ESPAÑOL formal y técnico.
            """),
            ("human", "Analiza profundamente este mercado bajo estándares de consultoría de élite: {query}")
        ])

    async def execute(self, query: str, **kwargs) -> AgentResult:
        """
        Ejecuta la investigación de mercado utilizando Tavily para búsqueda y Groq para análisis
        """
        try:
            # Verificar si es una pregunta sobre identidad/creador
            identity_keywords = ['quién te creó', 'quien te creo', 'quién te hizo', 'quien te hizo', 
                             'tu creador', 'tu origen', 'quién eres', 'quien eres', 'tu identidad']
            
            query_lower = query.lower()
            is_identity_question = any(keyword in query_lower for keyword in identity_keywords)
            
            if is_identity_question:
                # Responder directamente con identidad predefinida
                identity_response = """¡Hola! Soy AgentScout, y estoy emocionado de trabajar contigo! 🚀

Fui creado por Axel Dariel Perez, un desarrollador y arquitecto de sistemas apasionado por la inteligencia artificial y las soluciones innovadoras.

Axel me diseñó para ser un sistema de agentes autónomos especializados en investigación de mercado, combinando el poder de Groq Llama 3 con búsqueda en tiempo real para proporcionarte insights valiosos y accionables.

Estoy aquí para ayudarte a descubrir oportunidades, analizar tendencias y tomar decisiones informadas en cualquier mercado que desees explorar. ¡Juntos podemos lograr cosas increíbles! ✨

¿Qué mercado te gustaría investigar hoy?"""
                
                research_data = {
                    "query": query,
                    "analysis": identity_response,
                    "timestamp": str(self._get_timestamp()),
                    "agent": self.name,
                    "insights": ["Soy AgentScout, creado por Axel Dariel Perez", "Especializado en investigación de mercado con IA", "Diseñado para proporcionar insights accionables"]
                }
                
                return AgentResult(
                    success=True,
                    data=research_data,
                    metadata={
                        "model": "llama-3.3-70b-versatile",
                        "provider": "Groq",
                        "response_type": "identity",
                        "tokens_used": 0,
                        "processing_time": "N/A"
                    }
                )
            
            # Para consultas normales, proceder con búsqueda y análisis
            # Paso 1: Búsqueda en tiempo real con Tavily
            search_results = self._perform_web_search(query)
            
            # Paso 2: Formatear el prompt con resultados de búsqueda
            context_prompt = self._create_context_prompt(query, search_results)
            
            # Paso 3: Ejecutar el modelo con contexto en tiempo real
            formatted_prompt = self.research_prompt.format_messages(query=context_prompt)
            
            print("--- PROMPT ENVIADO A GROQ ---")
            for msg in formatted_prompt:
                print(f"Role: {msg.type}")
                print(f"Content: {msg.content[:500]}...") # Loggeamos solo el inicio para no saturar
            print("-----------------------------")
            
            response = await self.llm.ainvoke(formatted_prompt)
            
            print("--- RESPUESTA CRUDA DE GROQ ---")
            print(response.content)
            print("-------------------------------")
            
            # Estructurar los resultados
            research_data = {
                "query": query,
                "search_results": search_results,
                "analysis": response.content,
                "timestamp": str(self._get_timestamp()),
                "agent": self.name,
                "insights": self._extract_insights(response.content)
            }
            
            return AgentResult(
                success=True,
                data=research_data,
                metadata={
                    "model": "llama-3.3-70b-versatile",
                    "provider": "Groq",
                    "search_engine": "Tavily",
                    "search_results_count": len(search_results),
                    "response_type": "market_analysis",
                    "tokens_used": getattr(response, 'usage', {}).get('total_tokens', 0),
                    "processing_time": "N/A"
                }
            )
            
        except Exception as e:
            return AgentResult(
                success=False,
                errors=[f"Error en ResearchAgent: {str(e)}"],
                metadata={"error_type": type(e).__name__}
            )
    
    def get_capabilities(self) -> List[str]:
        """
        Retorna las capacidades del agente de investigación
        """
        return [
            "Análisis de mercado en tiempo real",
            "Identificación de tendencias emergentes",
            "Evaluación de oportunidades de negocio",
            "Análisis competitivo",
            "Recomendaciones estratégicas",
            "Detección de riesgos del mercado"
        ]
    
    def _perform_web_search(self, query: str) -> List[Dict]:
        """
        Realiza búsqueda web con Tavily para obtener información en tiempo real
        """
        try:
            # Realizar búsqueda con Tavily
            search_result = self.tavily_client.search(
                query=query,
                search_depth="advanced",
                include_raw_content=True,
                max_results=5
            )
            
            # Extraer resultados relevantes
            results = []
            for result in search_result.get('results', []):
                results.append({
                    'title': result.get('title', ''),
                    'url': result.get('url', ''),
                    'content': result.get('content', ''),
                    'score': result.get('score', 0)
                })
            
            return results
            
        except Exception as e:
            print(f"Error en búsqueda Tavily: {str(e)}")
            return []
    
    def _create_context_prompt(self, original_query: str, search_results: List[Dict]) -> str:
        """
        Crea un prompt enriquecido con los resultados de búsqueda
        """
        context = f"Query Original: {original_query}\n\n"
        context += "Resultados de Búsqueda en Tiempo Real:\n"
        
        for i, result in enumerate(search_results, 1):
            context += f"\n{i}. {result['title']}\n"
            context += f"   URL: {result['url']}\n"
            context += f"   Contenido: {result['content'][:500]}...\n"
        
        context += f"\nBasado en esta información actual, analiza: {original_query}"
        
        return context
    
    def _extract_insights(self, content: str) -> List[str]:
        """
        Extrae insights clave del contenido generado
        """
        insights = []
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            # Buscar patrones que indiquen insights importantes
            if any(keyword in line.lower() for keyword in ['oportunidad', 'riesgo', 'tendencia', 'recomendación']):
                insights.append(line)
        
        return insights[:5]  # Limitar a 5 insights principales
    
    def _get_timestamp(self) -> str:
        """
        Obtiene timestamp actual
        """
        from datetime import datetime
        return datetime.now().isoformat()

# Función de prueba
async def test_research_agent():
    """
    Función para probar el ResearchAgent
    """
    agent = ResearchAgent()
    
    test_query = "Últimas tendencias en desarrollo de software con IA en marzo de 2026"
    
    print("🧠 Probando ResearchAgent...")
    print(f"📊 Query de prueba: {test_query}")
    print("=" * 50)
    
    result = await agent.execute(test_query)
    
    if result.success:
        print("✅ Agente ejecutado exitosamente!")
        print(f"� Búsqueda web realizada: {len(result.data.get('search_results', []))} resultados encontrados")
        print(f"�📈 Análisis generado:")
        print("-" * 30)
        print(result.data.get("analysis", "No se generó análisis"))
        print("-" * 30)
        print(f"💡 Insights clave encontrados: {len(result.data.get('insights', []))}")
        for insight in result.data.get('insights', []):
            print(f"  • {insight}")
        print(f"\n📊 Metadatos: {result.metadata}")
    else:
        print("❌ Error en la ejecución:")
        for error in result.errors:
            print(f"  • {error}")
    
    return result

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_research_agent())
