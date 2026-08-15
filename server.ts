import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();



async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to get GoogleGenAI client
  function getGenAIClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    return new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Asistente: Explicar tema complejo con analogías y paso a paso
  app.post('/api/gemini/explain', async (req, res) => {
    try {
      const { topic, subject, academicLevel, country, userNotes } = req.body;
      if (!topic) {
        return res.status(400).json({ error: 'El tema es requerido' });
      }

      const ai = getGenAIClient();
      const prompt = `Actúa como un profesor y tutor universitario experto de Centroamérica (Costa Rica, Guatemala, Honduras, El Salvador, Nicaragua, Panamá).
Tema a explicar: "${topic}"
Materia / Curso: "${subject || 'General'}"
Nivel: "${academicLevel || 'Universitario'}"
País / Contexto: "${country || 'Centroamérica'}"
${userNotes ? `Apuntes adicionales del estudiante: "${userNotes}"` : ''}

Proporciona una explicación clara, didáctica, precisa y estimulante:
1. Resumen en 1 frase clave ("En pocas palabras").
2. Conceptos fundamentales explicados de manera intuitiva con una analogía cotidiana latinoamericana.
3. Paso a paso o desglose lógico / fórmula / aplicación práctica con un ejemplo resuelto.
4. "Trampas comunes" o errores frecuentes en exámenes centroamericanos sobre este tema.
5. 3 preguntas de autoevaluación rápida con respuestas ocultas/al final.

Usa formato Markdown con encabezados limpios, negritas y viñetas ordenadas.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      res.json({ text: response.text || 'No se pudo generar la explicación.' });
    } catch (error: any) {
      console.error('Error en /api/gemini/explain:', error);
      res.status(500).json({ error: error.message || 'Error al procesar la solicitud con IA' });
    }
  });

  // 2. Asistente: Generar Guía de Estudio / Ficha de Resumen
  app.post('/api/gemini/study-guide', async (req, res) => {
    try {
      const { subject, unitOrTopics, examType, examDate } = req.body;
      if (!subject || !unitOrTopics) {
        return res.status(400).json({ error: 'Materia y temas son requeridos' });
      }

      const ai = getGenAIClient();
      const prompt = `Crea una Guía de Estudio Rápida de Alto Rendimiento para el siguiente examen universitario:
Materia: "${subject}"
Tipo de Evaluación: "${examType || 'Examen Parcial / Final'}"
Temas cubiertos: "${unitOrTopics}"
${examDate ? `Fecha del examen: ${examDate}` : ''}

Estructura requerida en Markdown:
- 📌 **Mapa Conceptual & Ejes Clave** (Glosario de términos vitales)
- 🎯 **Fórmulas / Leyes / Principios Indispensables**
- ⚡ **Puntos Clave y Teoremas Más Preguntados**
- 💡 **Mnemotécnicas y Tips para Memorizar**
- 📝 **Estrategia para el día del examen** (Gestión del tiempo en la prueba)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      res.json({ text: response.text || 'No se pudo generar la guía.' });
    } catch (error: any) {
      console.error('Error en /api/gemini/study-guide:', error);
      res.status(500).json({ error: error.message || 'Error al procesar la solicitud' });
    }
  });

  // 3. Asistente: Generar Quiz / Simulacro de Examen Interactivo (JSON estructurado)
  app.post('/api/gemini/quiz', async (req, res) => {
    try {
      const { subject, topic, numQuestions = 5, difficulty = 'Media' } = req.body;
      if (!topic) {
        return res.status(400).json({ error: 'El tema es requerido' });
      }

      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Genera exactamente ${numQuestions} preguntas de opción múltiple tipo examen universitario centroamericano para la materia "${subject || 'General'}", tema "${topic}", nivel de dificultad: "${difficulty}". Cada pregunta debe tener 4 opciones y una justificación pedagógica detallada.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER, description: 'Índice de la respuesta correcta (0 a 3)' },
                    explanation: { type: Type.STRING, description: 'Explicación detallada de por qué es la correcta y por qué las demás no' },
                  },
                  required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
                },
              },
            },
            required: ['title', 'questions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Error en /api/gemini/quiz:', error);
      res.status(500).json({ error: error.message || 'Error al generar el quiz con IA' });
    }
  });

  // 4. Asistente: Planificador inteligente de estudio (Smart Scheduler)
  app.post('/api/gemini/study-plan', async (req, res) => {
    try {
      const { exams, hoursPerDay = 3, targetGPA } = req.body;
      const ai = getGenAIClient();
      
      const prompt = `Actúa como un asesor de productividad académica universitaria.
El estudiante tiene los siguientes compromisos y exámenes próximos:
${JSON.stringify(exams, null, 2)}
Horas de estudio disponibles por día: ${hoursPerDay} horas.
${targetGPA ? `Meta de promedio deseado: ${targetGPA}` : ''}

Diseña un plan de estudio semanal estructurado, priorizando por cercanía de fecha y ponderación porcentual del examen. Incluye bloques Pomodoro, pausas activas, sesiones de práctica activa y repasos espaciados. Responde en Markdown estructurado.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      res.json({ text: response.text || 'No se pudo generar el plan de estudio.' });
    } catch (error: any) {
      console.error('Error en /api/gemini/study-plan:', error);
      res.status(500).json({ error: error.message || 'Error al generar el plan de estudio' });
    }
  });

  // Vite middleware for dev or static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Estudiante Pro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
