#!/usr/bin/env python3
"""
Script de prueba para verificar el funcionamiento del ResearchAgent
"""

import asyncio
import sys
import os

# Agregar el directorio actual al path para importar los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Cargar variables de entorno desde .env
from dotenv import load_dotenv
load_dotenv()

from agents.researcher import test_research_agent

async def main():
    """
    Función principal de prueba
    """
    print("🚀 Iniciando prueba del AgentScout ResearchAgent")
    print("=" * 60)
    
    # Verificar que la API Key esté configurada
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ ERROR: No se encontró OPENAI_API_KEY en las variables de entorno")
        print("💡 Asegúrate de que el archivo .env contiene la API Key")
        return False
    
    print(f"✅ API Key encontrada: {api_key[:10]}...{api_key[-10:]}")
    print()
    
    # Ejecutar la prueba del agente
    try:
        result = await test_research_agent()
        
        if result.success:
            print("\n🎉 ¡Prueba completada exitosamente!")
            print("📊 El ResearchAgent está funcionando correctamente.")
            return True
        else:
            print("\n❌ La prueba falló")
            return False
            
    except Exception as e:
        print(f"\n💥 Error crítico durante la prueba: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
