// This is the final, correct 2nd Gen function code.
// Forcing a redeployment with this comment.  <-- ADD THIS LINE

const {onRequest} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// Define the secret key so Firebase can access it securely.
const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.parseEventText = onRequest(
    {secrets: [geminiApiKey], cors: true}, // Enable CORS for web app access
    async (req, res) => {
      // For onRequest, data is in req.body.data if called from client SDK
      const text = req.body.data.text;
      if (!text) {
        logger.error("Function called without text argument.");
        res.status(400).json({
          error: {
            message: "The function must be called with a 'text' argument.",
          },
        });
        return;
      }

      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey.value());
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash-preview-05-20",
        });

        const prompt = `
          You are an expert event parsing assistant. Your task is to extract
          event information from raw text and return it as a structured JSON.
          RULES:
          1. Extract: title, start_time, end_time, location, description.
          2. Format 'start_time' and 'end_time' as "YYYY-MM-DDTHH:MM". Use
             the current year (${new Date().getFullYear()}) if not specified.
             If only a start time is mentioned, estimate end_time as 2
             hours later.
          3. If a field's info is not found, return an empty string "".
          4. The 'description' should contain any extra details from the text.
          5. Your response must be ONLY the JSON object, with no extra text
             or markdown formatting.
          TEXT:
          "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text().replace(/```json|```/g, "").trim();
        const eventData = JSON.parse(jsonText);

        // For client SDK, wrap the response in a "data" object.
        res.json({data: {eventData}});
      } catch (error) {
        logger.error("Error calling Gemini API:", error);
        res.status(500).json({
          error: {
            message: "Failed to parse event data from AI service.",
          },
        });
      }
    },
);
