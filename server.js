
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const API_KEY = process.env.OPENROUTER_API_KEY;

app.get("/available-models", async (req, res) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const data = await response.json();
    const models = data.data?.map(m => m.id) || [];
    console.log("Modelos disponibles:", models);
    res.json({ models });
  } catch (err) {
    console.error("Error al obtener modelos:", err.message);
    res.status(500).json({ error: "No se pudieron obtener modelos" });
  }
});

app.post("/generate-menu", async (req, res) => {
  const { participants, days, climate } = req.body;
  const prompt = `
Eres un planificador nutricional para una fundación médica sin fines de lucro que realiza jornadas sociales. Debes generar un menú económico, sencillo, variado y sin alimentos costosos ni extravagantes. Usa ingredientes básicos y de fácil donación (como arroz, pasta, granos, vegetales, frutas locales, proteínas accesibles). Agrega una merienda diaria para cada persona.

Genera el menú para ${participants} personas durante ${days} días en una jornada con clima ${climate}. No repitas comidas y adáptalas al clima. Incluye desayuno, merienda, almuerzo y cena por día.

Al final, proporciona una lista de compras con cantidades detalladas en kilogramos, litros, gramos o unidades. Incluye también los condimentos y líquidos necesarios (agua, aceite, aliños).

Ejemplo:
Día 1:
- Desayuno: Arepas con caraotas
- Merienda: Cambur
- Almuerzo: Arroz con pollo y ensalada de repollo
- Cena: Sopa de vegetales y pan

Lista de compras:
- Arroz: 5kg
- Sal: 500g
- ...

Hazlo claro, preciso y completo.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        max_tokens: 1200,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    console.log("Respuesta completa de OpenRouter:", JSON.stringify(data, null, 2));
    const content = data.choices?.[0]?.message?.content || "Sin respuesta válida de la IA.";
    res.json({ result: content, raw: data });
  } catch (err) {
    console.error("Error al conectar con OpenRouter:", err);
    res.json({ error: "Error al generar menú: " + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
