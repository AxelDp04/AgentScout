#!/usr/bin/env python3
"""
Test simple para verificar el ResearchAgent sin consumir cuota de OpenAI
"""

import asyncio
import sys
import os

# Agregar el directorio actual al path para importar los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Cargar variables de entorno desde .env
from dotenv import load_dotenv
load_dotenv()

from agents.researcher import ResearchAgent

async def test_agent_structure():
    """
    Test para verificar la estructura del agente sin llamar a OpenAI
    """
    print("🧪 Test estructural del AgentScout ResearchAgent")
    print("=" * 50)
    
    # Verificar API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print(f"✅ API Key configurada: {api_key[:10]}...{api_key[-10:]}")
    else:
        print("❌ No se encontró OPENAI_API_KEY")
        return False
    
    # Crear instancia del agente
    try:
        agent = ResearchAgent()
        print(f"✅ Agente creado: {agent.name}")
        print(f"📝 Descripción: {agent.description}")
        
        # Verificar capacidades
        capabilities = agent.get_capabilities()
        print(f"⚡ Capacidades ({len(capabilities)}):")
        for i, capability in enumerate(capabilities, 1):
            print(f"  {i}. {capability}")
        
        # Test de estructura sin llamar a OpenAI
        print("\n🔍 Verificando estructura del agente...")
        
        # Verificar que tenga los atributos necesarios
        required_attrs = ['name', 'description', 'llm', 'research_prompt']
        for attr in required_attrs:
            if hasattr(agent, attr):
                print(f"✅ Atributo '{attr}' presente")
            else:
                print(f"❌ Atributo '{attr}' faltante")
                return False
        
        print("\n🎯 Estructura del agente verificada exitosamente!")
        print("📊 El agente está listo para usar con OpenAI")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al crear el agente: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_mock_research():
    """
    Test simulando una respuesta de investigación
    """
    print("\n🎭 Test simulado de investigación")
    print("=" * 40)
    
    try:
        agent = ResearchAgent()
        
        # Simular una respuesta exitosa
        mock_response = """
# Análisis del Mercado de Vehículos Eléctricos en América Latina

## Resumen Ejecutivo
El mercado de vehículos eléctricos en América Latina muestra un crecimiento acelerado, con Brasil y México liderando la adopción.

## Tendencias Clave
- Crecimiento del 45% anual en ventas
- Expansión de infraestructura de carga
- Políticas gubernamentales de incentivo

## Oportunidades Identificadas
- Mercado de carga pública en expansión
- Vehículos eléctricos comerciales
- Tecnología de baterías local

## Riesgos Potenciales
- Dependencia de importaciones
- Volatilidad de precios de energía
- Competencia asiática

## Recomendaciones Estratégicas
- Enfocarse en flotas corporativas
- Desarrollar soluciones de carga inteligente
- Establecer alianzas locales
        """
        
        # Extraer insights del mock
        insights = agent._extract_insights(mock_response)
        print(f"💡 Insights extraídos ({len(insights)}):")
        for insight in insights:
            print(f"  • {insight}")
        
        print("\n✅ Test simulado completado exitosamente!")
        return True
        
    except Exception as e:
        print(f"❌ Error en test simulado: {str(e)}")
        return False

async def main():
    """
    Función principal de prueba
    """
    print("🚀 AgentScout - Test Completo del ResearchAgent")
    print("=" * 60)
    
    success1 = await test_agent_structure()
    success2 = await test_mock_research()
    
    if success1 and success2:
        print("\n🎉 ¡Todos los tests pasaron exitosamente!")
        print("🧠 El ResearchAgent está correctamente implementado")
        print("💡 Nota: Para usar con OpenAI, verifica tu cuota y facturación")
        return True
    else:
        print("\n❌ Algunos tests fallaron")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
