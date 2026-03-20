'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Brain, TrendingUp, Globe, Loader2, CheckCircle, AlertTriangle, Lightbulb, Zap, Download, Instagram, Linkedin } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';

interface ResearchResult {
  query: string;
  analysis: string;
  insights: string[];
  timestamp: string;
  metadata?: {
    model?: string;
    provider?: string;
    search_engine?: string;
    search_results_count?: number;
  };
}

const isLowSignalContent = (content: string): boolean => {
  const normalized = (content || '').toLowerCase().trim();
  return (
    normalized.length === 0 ||
    normalized.includes('no se encontraron') ||
    normalized.includes('no hay') ||
    normalized.includes('sin resultados') ||
    normalized.includes('sin hallazgos')
  );
};

/**
 * Asegura que los delimitadores de negrita `**` estén “balanceados”
 * para que react-markdown renderice correctamente (sobre todo durante typing parcial).
 */
const normalizeMarkdownBold = (text: string): string => {
  const normalized = text || '';
  const matches = normalized.match(/\*\*/g);
  if (!matches) return normalized;
  if (matches.length % 2 === 0) return normalized;

  // Si hay un `**` “suelo” (un número impar), quitamos el último par literal
  // para evitar que se muestre como texto plano.
  const last = normalized.lastIndexOf('**');
  if (last === -1) return normalized;
  return normalized.slice(0, last) + normalized.slice(last + 2);
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Efecto Typewriter
  useEffect(() => {
    if (result?.analysis && !isTyping) {
      setIsTyping(true);
      setDisplayedText('');
      
      const text = result.analysis;
      let index = 0;
      
      const typeNextChar = () => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
          typewriterRef.current = setTimeout(typeNextChar, 15);
        } else {
          setIsTyping(false);
        }
      };
      
      typeNextChar();
    }
    
    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, [result?.analysis, isTyping]);

  const downloadPDF = async () => {
    if (!result) return;

    try {
      const element = document.getElementById('results-content');
      if (!element) return;

      // Crear un canvas del contenido
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0b0f14'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Añadir título
      pdf.setFontSize(20);
      pdf.setTextColor(16, 185, 129);
      pdf.text('AgentScout - Reporte de Análisis', 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Query: ${result.query}`, 20, 35);
      pdf.text(`Fecha: ${new Date(result.timestamp).toLocaleString('es-ES')}`, 20, 45);
      
      if (result.metadata?.model) {
        pdf.text(`Modelo: ${result.metadata.model}`, 20, 55);
      }
      
      // Añadir imagen del análisis
      pdf.addImage(imgData, 'PNG', 0, 70, imgWidth, imgHeight);
      
      // Guardar el PDF
      pdf.save(`AgentScout_${result.query.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setError('Error al generar el PDF');
    }
  };

  const loadingMessages = [
    'Agente investigando...',
    'Analizando tendencias...',
    'Generando reporte...'
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    // Simular etapas de carga
    setLoadingStage(loadingMessages[0]);
    setTimeout(() => setLoadingStage(loadingMessages[1]), 1500);
    setTimeout(() => setLoadingStage(loadingMessages[2]), 3000);
    
    try {
      // URL del backend inyectada por entorno (Vercel/Render).
      // Debe apuntar al endpoint completo: /api/research
      const backendFromEnv = process.env.NEXT_PUBLIC_API_URL;
      const backendCandidates = backendFromEnv
        ? [backendFromEnv]
        : [
            'http://localhost:8000/api/research',
            // Fallback por compatibilidad de loopback/hosts.
            'http://127.0.0.1:8000/api/research',
          ];

      let lastError: unknown = null;

      for (const url of backendCandidates) {
        try {
          console.log('Enviando solicitud a:', url);
          console.log('Datos enviados:', { query, depth: 'standard' });

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, depth: 'standard' }),
          });

          console.log('Respuesta recibida:', response.status, response.statusText);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Datos parseados:', data);
          
          if (data.status === 'success') {
            setResult(data.data);
          } else {
            setError(data.message || 'Error desconocido');
          }

          return; // Éxito (o respuesta válida con status error)
        } catch (err) {
          lastError = err;

          // Si es un error de conectividad, probamos el siguiente endpoint candidato.
          if (err instanceof Error && err.message === 'Failed to fetch') {
            continue;
          }

          // Si es un error HTTP/JSON (no conectividad), no lo ocultamos.
          throw err;
        }
      }

      throw lastError instanceof Error ? lastError : new Error('Failed to fetch');

    } catch (err) {
      console.error('Error completo:', err);
      setError(`Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  // Componente de Skeleton con Shimmer estático
const SkeletonCard = () => (
 <div className="bg-[#17191e] rounded-2xl p-6 border border-white/5">
    <div className="flex items-center mb-4">
      <div className="w-5 h-5 bg-white/10 rounded mr-3"></div>
      <div className="h-6 bg-white/8 rounded w-32"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-white/5 rounded w-full"></div>
      <div className="h-4 bg-white/5 rounded w-5/6"></div>
      <div className="h-4 bg-white/5 rounded w-4/5"></div>
    </div>
  </div>
);

const LoadingAnimation = () => (
  <div className="flex flex-col items-center justify-center py-12 space-y-8">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-emerald-200/25 border-t-emerald-400 rounded-full"></div>
      <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-300" />
    </div>
    <p className="text-lg font-medium text-[#9ca3af] tracking-wide">
      {loadingStage}
    </p>
    
    {/* Skeletons estáticos simulando la estructura del reporte */}
    <div className="w-full max-w-5xl space-y-6 mt-8">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

  const ResultsDisplay = ({ data }: { data: ResearchResult }) => {
    // Si no hay datos o no hay análisis, mostrar estado por defecto
    if (!data || !data.analysis) {
      return (
        <div className="bg-[#17191e] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-[#ffffff]">Datos no disponibles</h4>
              <p className="text-[#9ca3af]">No se pudo obtener el análisis del servidor.</p>
            </div>
          </div>
        </div>
      );
    }

    const fallbackInsights = Array.isArray(data.insights) ? data.insights : [];
    const resumenFallback = fallbackInsights.slice(0, 2).join('\n').trim();
    const oportunidadesFallback = fallbackInsights.filter((i) => /oportun/i.test(i)).join('\n').trim();
    const riesgosFallback = fallbackInsights.filter((i) => /riesg/i.test(i)).join('\n').trim();

    const sourceText = (displayedText && displayedText.trim().length > 0 ? displayedText : data.analysis) || '';

    const extractByNumberedHeadings = (
      text: string,
      start: RegExp,
      end: RegExp | null
    ): string => {
      const lines = (text || '').replace(/\r\n/g, '\n').split('\n');

      const startIndex = lines.findIndex((l) => start.test(l));
      if (startIndex === -1) return '';

      const endIndex = end ? lines.findIndex((l, idx) => idx > startIndex && end.test(l)) : -1;

      const effectiveEndIndex = endIndex === -1 ? lines.length : endIndex;
      const startLine = lines[startIndex] || '';
      const startLineContent = startLine.replace(start, '').trim();

      const middleLines = lines.slice(startIndex + 1, effectiveEndIndex).join('\n').trim();
      const combined = [startLineContent, middleLines].filter(Boolean).join('\n').trim();
      return combined;
    };

    // Backend formatea así: 1. Resumen Ejecutivo, 2. Tendencias Clave, 3. Oportunidades Identificadas...
    // El frontend antes intentaba partir con '**Encabezado**', lo cual no siempre coincide.
    const resumenText =
      extractByNumberedHeadings(
        sourceText,
        /^\s*(?:1\.\s*)?(?:\*\*\s*)?Resumen\s+Ejecutivo(?:\s*\*\*)?/i,
        /^\s*(?:2\.\s*)?(?:\*\*\s*)?Tendencias\s+Clave(?:\s*\*\*)?/i
      ) || resumenFallback;

    const oportunidadesText =
      extractByNumberedHeadings(
        sourceText,
        /^\s*(?:3\.\s*)?(?:\*\*\s*)?Oportunidades\s+Identificadas(?:\s*\*\*)?/i,
        /^\s*(?:4\.\s*)?(?:\*\*\s*)?Riesgos\s+Potenciales(?:\s*\*\*)?/i
      ) || oportunidadesFallback;

    const riesgosText =
      extractByNumberedHeadings(
        sourceText,
        /^\s*(?:4\.\s*)?(?:\*\*\s*)?Riesgos\s+Potenciales(?:\s*\*\*)?/i,
        /^\s*(?:5\.\s*)?(?:\*\*\s*)?Recomendaciones\s+Estrat(?:égicas)?(?:\s*\*\*)?/i
      ) || riesgosFallback;

    const sections = [
      {
        title: 'Resumen Ejecutivo',
        icon: <Brain className="w-5 h-5" />,
        content: resumenText || 'No hay resumen disponible',
        color: 'from-blue-500 to-purple-600'
      },
      {
        title: 'Oportunidades',
        icon: <Lightbulb className="w-5 h-5" />,
        content: oportunidadesText || 'No se encontraron oportunidades',
        color: 'from-green-500 to-teal-600'
      },
      {
        title: 'Riesgos',
        icon: <AlertTriangle className="w-5 h-5" />,
        content: riesgosText || 'No se encontraron riesgos',
        color: 'from-red-500 to-orange-600'
      }
    ];

    return (
    <div className="space-y-6" id="results-content">
      {/* Header de resultados estático */}
      <div className="bg-[#17191e] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-xl font-semibold text-[#ffffff] mb-2 tracking-wide">Análisis Completado</h3>
                <p className="text-[#9ca3af]">Query: {data.query}</p>
          </div>
          <div className="text-right">
                <p className="text-[#9ca3af]">Modelo: {data.metadata?.model || 'N/A'}</p>
                <p className="text-[#9ca3af]">Proveedor: {data.metadata?.provider || 'N/A'}</p>
                {data.metadata?.search_engine && (
                  <p className="text-[#9ca3af]">Búsqueda: {data.metadata.search_engine}</p>
                )}
                {/* Botón de descarga PDF */}
                <button
                  onClick={downloadPDF}
                  className="mt-3 px-4 py-2 bg-emerald-500/15 border border-white/5 text-white rounded-lg font-medium hover:bg-emerald-500/20 transition-colors duration-200 flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
          </div>
        </div>
      </div>

      {/* Secciones de análisis estáticas */}
      <div className="grid gap-6">
        {sections.map((section, index) => {
          const isMuted = isLowSignalContent(section.content);
          return (
          <div
            key={index}
            className={`rounded-2xl p-6 border border-white/5 transition-opacity duration-300 ${
              isMuted ? 'bg-[#17191e] opacity-70' : 'bg-[#17191e] opacity-100'
            }`}
          >
            <div className="flex items-center mb-4 relative z-10">
              <div className="p-2 rounded-lg bg-[#0f131a] border border-white/5 text-emerald-200 mr-3">
                {section.icon}
              </div>
              <h4 className="text-lg font-semibold text-[#ffffff] tracking-wide">{section.title}</h4>
            </div>
            <div
              className={`leading-relaxed tracking-[0.01em] relative z-10 ${
                isMuted ? 'opacity-60' : 'opacity-100'
              }`}
            >
              <ReactMarkdown
                skipHtml
                components={{
                  p: ({ children }) => (
                    <p className="text-[#9ca3af] mb-3 last:mb-0 px-1 py-1.5">{children}</p>
                  ),
                  strong: ({ children }) => <strong className="text-[#ffffff] font-bold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc pl-5 text-[#9ca3af] space-y-1 mb-3">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 text-[#9ca3af] space-y-1 mb-3">{children}</ol>,
                  li: ({ children }) => <li className="text-[#9ca3af]">{children}</li>,
                  h1: ({ children }) => <h5 className="text-[#ffffff] font-semibold mb-2">{children}</h5>,
                  h2: ({ children }) => <h5 className="text-[#ffffff] font-semibold mb-2">{children}</h5>,
                  h3: ({ children }) => <h5 className="text-[#ffffff] font-semibold mb-2">{children}</h5>,
                }}
              >
                {normalizeMarkdownBold(section.content)}
              </ReactMarkdown>
              {isTyping && (
                <span className="inline-block w-2 h-5 bg-emerald-400/60 ml-1 opacity-80 rounded-sm"></span>
              )}
            </div>
          </div>
        )})}
      </div>

        {/* Insights clave estáticos */}
        {data.insights && data.insights.length > 0 && (
          <div className="bg-[#17191e] rounded-2xl p-6 border border-white/5">
            <h4 className="text-lg font-semibold text-[#ffffff] mb-4 flex items-center relative z-10">
              <CheckCircle className="w-5 h-5 mr-2 text-emerald-300" />
              Insights Clave
            </h4>
            <div className="space-y-2 relative z-10">
              {data.insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start rounded-xl border border-white/5 bg-[#0f131a] p-4"
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <ReactMarkdown
                    skipHtml
                    components={{
                      p: ({ children }) => (
                        <p className="text-[#9ca3af] text-sm leading-relaxed tracking-[0.01em] mb-3 last:mb-0 px-1 py-1.5">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-[#ffffff] font-bold">{children}</strong>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 text-[#9ca3af] space-y-1 mb-3">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 text-[#9ca3af] space-y-1 mb-3">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li className="text-[#9ca3af]">{children}</li>,
                      h1: ({ children }) => (
                        <h5 className="text-[#ffffff] font-semibold mb-2">{children}</h5>
                      ),
                      h2: ({ children }) => (
                        <h5 className="text-[#ffffff] font-semibold mb-2">{children}</h5>
                      ),
                      h3: ({ children }) => (
                        <h5 className="text-[#ffffff] font-semibold mb-2">{children}</h5>
                      ),
                    }}
                  >
                    {normalizeMarkdownBold(insight)}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans antialiased" style={{ backgroundColor: '#0b0e14' }}>
      {/* Fondo negro sólido */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0b0e14]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header Premium estático */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <Brain className="w-16 h-16 text-emerald-200 mr-4" />
              <div className="absolute inset-0 bg-emerald-200 rounded-full opacity-10"></div>
            </div>
            <h1 className="text-6xl font-semibold text-[#ffffff] tracking-wide" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
              AgentScout
            </h1>
          </div>
          <p className="text-2xl text-[#9ca3af] mb-3 font-light tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
            Sistema de Agentes Autónomos
          </p>
          <p className="text-[#9ca3af] text-lg font-medium opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>
            Potenciado por IA para análisis de mercado en tiempo real
          </p>
        </div>

        {/* Barra de búsqueda principal estática */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-[#17191e] rounded-2xl p-8 border border-white/5">
            <label className="block text-lg font-medium mb-4 text-[#9ca3af] relative z-10 tracking-wide">
              ¿Qué mercado quieres investigar hoy?
            </label>
            <div className="flex gap-4 relative z-10">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ej: Últimas tendencias en desarrollo de software con IA..."
                className="flex-1 px-6 py-4 bg-[#0f131a] border border-white/5 rounded-xl text-[#ffffff] placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-emerald-400/25 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="px-8 py-4 bg-emerald-500/15 border border-white/5 text-white rounded-xl font-medium hover:bg-emerald-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 relative z-10"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {isLoading ? 'Analizando...' : 'Investigar'}
              </button>
            </div>
          </div>
        </div>

        {/* Estados de carga y resultados */}
        <div className="max-w-4xl mx-auto">
          {isLoading && <LoadingAnimation />}
          
          {error && (
            <div className="bg-[#17191e] rounded-2xl p-6 border border-white/5">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
                <div>
                  <h4 className="text-lg font-semibold text-[#ffffff]">Error</h4>
                  <p className="text-[#9ca3af]">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {result && !isLoading && <ResultsDisplay data={result} />}
        </div>

        {/* Features estáticos */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
          <div className="bg-[#17191e] rounded-xl p-6 border border-white/5">
            <div className="relative z-10">
              <Globe className="w-10 h-10 text-emerald-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-[#ffffff]">Web Scraping Inteligente</h3>
              <p className="text-[#9ca3af] leading-relaxed">
                Extrae información de múltiples fuentes web de forma automática y estructurada.
              </p>
            </div>
          </div>
          <div className="bg-[#17191e] rounded-xl p-6 border border-white/5">
            <div className="relative z-10">
              <TrendingUp className="w-10 h-10 text-yellow-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-[#ffffff]">Análisis de Tendencias</h3>
              <p className="text-[#9ca3af] leading-relaxed">
                Detecta patrones y tendencias emergentes en el mercado utilizando IA avanzada.
              </p>
            </div>
          </div>
          <div className="bg-[#17191e] rounded-xl p-6 border border-white/5">
            <div className="relative z-10">
              <Brain className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-[#ffffff]">Agentes Autónomos</h3>
              <p className="text-[#9ca3af] leading-relaxed">
                Múltiples agentes trabajando en paralelo para obtener insights completos.
              </p>
            </div>
          </div>
        </div>

        {/* Social links minimalistas */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          <a
            href="https://www.instagram.com/agentscout.ia/?utm_source=ig_web_button_share_sheet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-200 transition-colors duration-200"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/axel-perez-a28016316/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-200 transition-colors duration-200"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
