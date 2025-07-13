
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
Eres un planificador nutricional. Crea un menú variado para ${participants} personas, durante ${days} días, en una jornada con clima ${climate}. Evita repetir comidas. Incluye desayuno, almuerzo, cena y merienda por día, adecuados al clima (alimentos no tan caros). Al final, proporciona una lista de compras con cantidades detalladas en kg, litros, gramos y unidades, incluyendo condimentos.

Ejemplo:
Día 1:
- Desayuno: ...
- Almuerzo: ...
- Cena: ...

Lista de compras:
- Arroz: 5kg
- Sal: 500g
- ...

Hazlo claro, preciso y completo.
`;

  console.log("CLAVE API desde Render:", API_KEY);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto",  // Usa el mejor modelo disponible
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
