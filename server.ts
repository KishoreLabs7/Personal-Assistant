import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    aiInstance = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// REST API routes must be placed BEFORE compiling Vite
app.post("/api/classify-emails", async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: "Invalid emails list" });
    }
    if (emails.length === 0) {
      return res.json({ evaluations: [] });
    }

    const aiClient = getGeminiClient();
    const formattedEmails = emails.map(m => `
ID: ${m.id}
FROM: ${m.from}
SUBJECT: ${m.subject}
SNIPPET: ${m.snippet}
DATE: ${m.date}
---`).join('\n');

    const prompt = `You are a professional assistant triaging incoming emails for Venkata. Classify each of the following candidate emails according to whether they are important or not, categorize them, summarize them, and explain the reason.
    
Emails:
${formattedEmails}

Evaluate every single email correctly. Return the structured results mapped to their precise string 'id'.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Venkata's administrative inbox assistant. Determine priority. is_important should be true ONLY for direct human-to-human outreach, action-required notifications, invoices/payments, and calendar invitations. Run strict categorization.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            evaluations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Original email string ID." },
                  is_important: { type: Type.BOOLEAN, description: "True if important, false otherwise." },
                  category: { type: Type.STRING, description: "Must be exactly one of: 'Action Required', 'Informational', 'Social/Personal', 'Newsletter', 'System Notification'" },
                  summary: { type: Type.STRING, description: "One-sentence executive summary of contents." },
                  reason: { type: Type.STRING, description: "Reason why it is important or not." }
                },
                required: ["id", "is_important", "category", "summary", "reason"]
              }
            }
          },
          required: ["evaluations"]
        }
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Error classifying emails:", error);
    res.status(500).json({ error: error.message || "Failed to classify emails." });
  }
});

// Configure Vite middleware or static serving
async function configureApp() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteInstance.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

configureApp().catch((err) => {
  console.error("Failed to start server:", err);
});
