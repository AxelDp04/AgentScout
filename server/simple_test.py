#!/usr/bin/env python3
"""
Test simple para verificar la API Key sin dependencias externas
"""

import os
from dotenv import load_dotenv

def test_api_key():
    """Test básico para verificar la API Key"""
    print("🧪 Test simple de AgentScout")
    print("=" * 40)
    
    # Cargar variables de entorno
    load_dotenv()
    
    # Verificar API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print(f"✅ API Key encontrada: {api_key[:10]}...{api_key[-10:]}")
        print(f"📏 Longitud: {len(api_key)} caracteres")
        
        # Verificar formato básico
        if api_key.startswith("sk-proj-") and len(api_key) > 50:
            print("✅ Formato de API Key válido (sk-proj-)")
        else:
            print("⚠️  Formato inusual de API Key")
    else:
        print("❌ No se encontró OPENAI_API_KEY")
        return False
    
    # Test de import básico sin dependencias externas
    try:
        print("\n🔍 Verificando estructura del proyecto...")
        
        # Verificar archivos clave
        files_to_check = [
            ".env",
            "main.py", 
            "agents/__init__.py",
            "agents/base_agent.py",
            "agents/researcher.py"
        ]
        
        for file in files_to_check:
            if os.path.exists(file):
                print(f"✅ {file}")
            else:
                print(f"❌ {file} no encontrado")
        
        print("\n🎯 Prueba básica completada!")
        print("📝 Nota: Para probar el agente completo, instala las dependencias:")
        print("   pip install fastapi langchain openai python-dotenv")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_api_key()
    print(f"\n🏁 Resultado: {'EXITOSO' if success else 'FALLO'}")
