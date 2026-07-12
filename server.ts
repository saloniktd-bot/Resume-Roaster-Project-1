import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import "dotenv/config";

// Lazy-initialize the Gemini client to avoid crashing if GEMINI_API_KEY is not set immediately
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

// Setup JSON parsing with high limit for base64 file payloads (e.g. PDFs)
app.use(express.json({ limit: "15mb" }));

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Resume Roasting API Endpoint
app.post("/api/roast", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { text, file, intensity = "spicy" } = req.body;

    // Direct programmatic blank validation
    const hasPastedText = text && text.trim().length > 0;
    const hasUploadedFile = file && file.base64 && file.base64.trim().length > 0;

    if (!hasPastedText && !hasUploadedFile) {
      res.json({
        is_blank: true,
        roast: "No real content found",
        overall_feedback: "No real content found",
        key_strengths: [],
        improvements: [],
        bullet_makeovers: [],
        ats_score: 0,
        interview_probability: "None (Please upload or paste a resume file)"
      });
      return;
    }

    const ai = getAiClient();
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "Gemini API Key is missing. Please set GEMINI_API_KEY in the Secrets panel." });
      return;
    }

    // Prepare contents array for Gemini
    const contents: any[] = [];
    let extractedDocxText = "";
    let extractedPlainText = "";
    let isWordDoc = false;
    let isPlainText = false;

    if (hasUploadedFile) {
      const mime = (file.mimeType || "").toLowerCase();
      const fileNameLower = (file.name || "").toLowerCase();
      const isDocx = mime.includes("wordprocessingml") || mime.includes("docx") || fileNameLower.endsWith(".docx");
      const isDoc = mime.includes("msword") || fileNameLower.endsWith(".doc");
      
      if (isDocx) {
        isWordDoc = true;
        try {
          const buffer = Buffer.from(file.base64, "base64");
          const result = await mammoth.extractRawText({ buffer });
          extractedDocxText = result.value || "";
          console.log(`[Resume Roaster] Extracted ${extractedDocxText.length} characters from docx file.`);
        } catch (docxErr: any) {
          console.error("Error extracting text from Word document:", docxErr);
          res.status(400).json({ error: "Failed to extract text from the Word (.docx) file. Please ensure it's not corrupted." });
          return;
        }
      } else if (isDoc) {
        res.status(400).json({ error: "Legacy Word document (.doc) is not supported. Please save your file as modern Word Document (.docx) or PDF and upload again." });
        return;
      } else {
        const isTxt = mime.includes("text/plain") || fileNameLower.endsWith(".txt");
        const isMd = mime.includes("text/markdown") || mime.includes("text/x-markdown") || fileNameLower.endsWith(".md");
        
        if (isTxt || isMd) {
          isPlainText = true;
          try {
            const buffer = Buffer.from(file.base64, "base64");
            extractedPlainText = buffer.toString("utf-8");
            console.log(`[Resume Roaster] Extracted ${extractedPlainText.length} characters from plain text file.`);
          } catch (txtErr) {
            console.error("Error decoding plain text file:", txtErr);
          }
        }
      }
    }

    // Add binary file if uploaded and is PDF/Image
    if (hasUploadedFile && !isWordDoc && !isPlainText) {
      let mimeType = file.mimeType || "application/pdf";
      if (mimeType === "image/jpg") {
        mimeType = "image/jpeg";
      }
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: file.base64,
        }
      });
    }

    // Add text prompt
    const intensityPrompt = 
      intensity === "mild" ? "Keep the roast soft and mostly constructive, like a gentle nudge." :
      intensity === "savage" ? "Go absolutely ruthless, savage, and roast with zero filter. Roast like a comedian on stage, but keep the actionable advice highly valuable." :
      "Provide a balanced, sassy, and brutally honest roast that exposes typical resume clichés and weak spots.";

    let resumeText = "";
    if (hasPastedText) {
      resumeText += `\n\n--- PASTED RESUME TEXT ---\n${text}`;
    }
    if (isWordDoc && extractedDocxText) {
      resumeText += `\n\n--- EXTRACTED WORD DOCUMENT TEXT ---\n${extractedDocxText}`;
    }
    if (isPlainText && extractedPlainText) {
      resumeText += `\n\n--- EXTRACTED PLAIN TEXT ---\n${extractedPlainText}`;
    }

    const promptText = `
${intensityPrompt}

If the resume document is completely empty, has no readable text, has only minor layout noise, or contains no genuine resume content (like experience, contact info, skills, education), you MUST set "is_blank" to true and return exactly "No real content found" for the roast, overall_feedback, and other text fields.

Otherwise, roast this resume thoroughly and provide structured, honest feedback with actionable recommendations to help the user secure an interview.
${resumeText ? `\n\nHere is the resume content:\n${resumeText}` : "\n\nPlease analyze the uploaded file (PDF/Image) provided alongside this prompt."}
`;

    contents.push(promptText);

    // Define response schema to structure the feedback nicely
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        is_blank: {
          type: Type.BOOLEAN,
          description: "True if the resume has no real content, is completely empty, or is unreadable. Otherwise false."
        },
        roast: {
          type: Type.STRING,
          description: "A funny, brutal, honest, and sassy roast of the resume. If the document is blank or unreadable, this MUST be exactly 'No real content found'."
        },
        overall_feedback: {
          type: Type.STRING,
          description: "A professional, direct, and honest high-level summary of the resume's major issues and general direction. If the document is blank, this MUST be exactly 'No real content found'."
        },
        key_strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2-3 actual positive highlights found in the resume to keep it constructive."
        },
        improvements: {
          type: Type.ARRAY,
          description: "A structured list of category-specific actionable improvements.",
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "The category (e.g., 'Impact & Metrics', 'ATS Optimization', 'Formatting', 'Fluff')." },
              critique: { type: Type.STRING, description: "Honest feedback about what's currently weak." },
              actionable_steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Concrete step-by-step guidelines to solve this weakness."
              }
            },
            required: ["category", "critique", "actionable_steps"]
          }
        },
        bullet_makeovers: {
          type: Type.ARRAY,
          description: "Before-and-after makeover examples of bullet points.",
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING, description: "A weak or typical bullet point from the resume." },
              improved: { type: Type.STRING, description: "A powerful, results-oriented rewrite using the X-Y-Z formula (Accomplished X, measured by Y, doing Z)." },
              why: { type: Type.STRING, description: "Short description of why the change works." }
            },
            required: ["original", "improved", "why"]
          }
        },
        ats_score: {
          type: Type.INTEGER,
          description: "An estimated score out of 100 for ATS compatibility and overall impression."
        },
        interview_probability: {
          type: Type.STRING,
          description: "A realistic probability of landing interviews (e.g. Low, Medium, High) with a concise explanation."
        }
      },
      required: [
        "is_blank",
        "roast",
        "overall_feedback",
        "key_strengths",
        "improvements",
        "bullet_makeovers",
        "ats_score",
        "interview_probability"
      ]
    };

    const systemInstruction = `You are a world-class executive recruiter, resume reviewer, and comedic roast master. 
Your goal is to inspect a resume and provide a brutally honest, cheeky, and entertaining "roast", followed by structured, high-quality, actionable, and constructive feedback that helps the user drastically improve their chances of landing interviews.

CRITICAL EDGE CASE RULE:
If the resume is completely blank, has no readable text, has only minor nonsensical characters, or is completely empty, you MUST set the "is_blank" field to true, and set the "roast" and "overall_feedback" fields to exactly "No real content found". All other list fields should be empty.`;

    let response: any = null;
    let lastError: any = null;
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];

    for (const modelName of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;
      let delay = 1000;

      while (attempts < maxAttempts) {
        try {
          console.log(`[Resume Roaster] Attempting roast using model: ${modelName}, attempt: ${attempts + 1}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
              temperature: 0.9,
            }
          });
          break; // Success!
        } catch (err: any) {
          lastError = err;
          attempts++;
          
          console.error(`[Resume Roaster] Error on model ${modelName}, attempt ${attempts}:`, err);

          const status = err?.status || err?.statusCode;
          const isTransient = status === 429 || status === 503 || (err?.message && (
            err.message.includes("503") ||
            err.message.includes("429") ||
            err.message.includes("high demand") ||
            err.message.includes("temporary") ||
            err.message.includes("overloaded") ||
            err.message.includes("timeout") ||
            err.message.includes("fetch failed")
          ));

          if (attempts < maxAttempts && isTransient) {
            console.warn(`[Resume Roaster] Transient error on ${modelName}. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            console.warn(`[Resume Roaster] Moving on from model ${modelName} due to persistent error.`);
            break; 
          }
        }
      }

      if (response) {
        console.log(`[Resume Roaster] Successfully roasted using model: ${modelName}`);
        break; 
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to generate content after trying multiple models and retries.");
    }

    const resultText = response.text || "{}";
    let jsonResult;
    try {
      jsonResult = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON response:", resultText);
      throw new Error("Could not parse roasted feedback from model.");
    }

    // Force strict "No real content found" if Gemini marked as blank or if response indicates empty
    if (jsonResult.is_blank || !jsonResult.roast || jsonResult.roast.toLowerCase().includes("no real content found")) {
      res.json({
        is_blank: true,
        roast: "No real content found",
        overall_feedback: "No real content found",
        key_strengths: [],
        improvements: [],
        bullet_makeovers: [],
        ats_score: 0,
        interview_probability: "None"
      });
      return;
    }

    res.json(jsonResult);
  } catch (error: any) {
    console.error("Error roasting resume:", error);
    res.status(500).json({
      error: error.message || "An error occurred while roasting your resume. Please try again."
    });
  }
});

// Configure Vite or Static files depending on Environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Resume Roaster Server] running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
