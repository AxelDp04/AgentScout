# AgentScout 🧠

Sistema de Agentes Autónomos para Investigación de Mercado

## 🚀 Características

- **Web Scraping Inteligente**: Extrae información de múltiples fuentes web
- **Análisis de Tendencias**: Detecta patrones emergentes con IA
- **Agentes Autónomos**: Múltiples agentes trabajando en paralelo
- **Interfaz Moderna**: Construida con Next.js 14 y Tailwind CSS

## 🏗️ Arquitectura

```
agentscout/
├── server/          # Backend FastAPI
│   ├── agents/      # Módulos de agentes
│   ├── main.py      # API principal
│   └── requirements.txt
├── client/          # Frontend Next.js
│   └── src/
│       └── app/
│           └── page.tsx
└── .env.example     # Variables de entorno
```

## 🛠️ Instalación

### Backend

```bash
cd server
pip install -r requirements.txt
```

### Frontend

```bash
cd client
npm install
```

### Configuración

1. Copia `.env.example` a `.env`
2. Configura tus API Keys:
   - OpenAI API Key
   - Tavily o Serper API Key

## 🏃‍♂️ Ejecutar

### Backend

```bash
cd server
python main.py
```

### Frontend

```bash
cd client
npm run dev
```

## 📚 Tecnologías

- **Backend**: FastAPI, LangChain, Playwright, Pydantic
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide React
- **IA**: OpenAI GPT, Web Scraping

## 🔮 Próximos Features

- [ ] Integración con bases de datos
- [ ] Sistema de caché con Redis
- [ ] Dashboard de resultados
- [ ] Exportación a PDF/Excel
- [ ] API para terceros
