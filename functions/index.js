// Updated to use Gemini Vision API directly with improved error handling

const {onRequest} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// Define the secret key so Firebase can access it securely.
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Parse event details from an image using Gemini Vision API
 * Accepts base64 encoded image data
 */
exports.parseEventImage = onRequest(
    {
      secrets: [geminiApiKey],
      cors: true,
      maxInstances: 10,
      timeoutSeconds: 60,
      memory: "512MiB",
    },
    async (req, res) => {
      // Get image data from request
      const {imageData, mimeType} = req.body.data || {};

      if (!imageData) {
        logger.error("Function called without image data.");
        return res.status(400).json({
          error: {
            code: "MISSING_IMAGE",
            message: "Please provide an image to process.",
          },
        });
      }

      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey.value());
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash", // Stable model with better performance
        });

        const prompt = `
You are an expert multilingual event extraction assistant. Analyze this image to determine if it contains event information.

CRITICAL: First determine if this image is actually an event poster, flyer, or announcement. 
- Event posters typically contain: event name, date/time, location/venue
- NOT event posters: circuit diagrams, random photos, memes, screenshots, product images, etc.

TASK: Return ONLY a valid JSON object with this exact structure:
{
  "is_event": true/false,
  "title": "event title",
  "start_time": "YYYY-MM-DDTHH:MM",
  "end_time": "YYYY-MM-DDTHH:MM", 
  "location": "venue/address",
  "description": "additional details",
  "confidence": "high|medium|low",
  "field_confidence": {
    "title": "high|medium|low",
    "start_time": "high|medium|low",
    "end_time": "high|medium|low",
    "location": "high|medium|low",
    "description": "high|medium|low"
  },
  "warnings": ["array of any concerns or uncertainties"],
  "recurring": {
    "is_recurring": true/false,
    "pattern": "description of recurrence (e.g., 'Every Monday at 6pm', 'Weekly on Tuesdays', 'Daily at 3pm')",
    "frequency": "daily|weekly|monthly|yearly|custom"
  },
  "registration": {
    "url": "registration/ticket link if found",
    "price": "ticket price or 'Free' if mentioned",
    "deadline": "registration deadline if mentioned"
  },
  "organizer": {
    "name": "organizer name or organization",
    "contact": "email or phone if provided",
    "website": "organizer website if mentioned"
  },
  "language": "detected language code (en, es, fr, de, zh, ja, etc.)"
}

ENHANCED EXTRACTION RULES:
1. Set "is_event" to false if this is clearly NOT an event poster (circuit diagram, random image, etc.)
2. If "is_event" is false, set confidence to "low" and add warning explaining why
3. If date/time is missing or unclear, confidence MUST be "low" or "medium" at best
4. If location is missing, confidence cannot be "high"
5. Use current year (${new Date().getFullYear()}) if year not specified
6. If only start time exists, estimate end_time as 2 hours later

RECURRING EVENT DETECTION:
7. Look for phrases like "Every [day]", "Weekly", "Monthly", "Daily", "[Day] at [time]"
8. Set is_recurring to true if pattern is detected, describe the pattern clearly
9. Parse frequency: daily, weekly, monthly, yearly, or custom for complex patterns

REGISTRATION & PRICING:
10. Extract any URLs for registration, tickets, RSVP, or "Learn More"
11. Look for price mentions: "$10", "€5", "£20", "Free", "No charge", "Complimentary"
12. Find registration deadlines: "Register by", "RSVP before", "Tickets until"

ORGANIZER INFORMATION:
13. Identify hosting organization, club, company, or person's name
14. Extract contact info: email addresses, phone numbers
15. Find organizer websites or social media handles

MULTI-LANGUAGE SUPPORT:
16. Detect the primary language of the poster (English, Spanish, French, German, Chinese, Japanese, etc.)
17. Parse dates in any format (MM/DD, DD/MM, YYYY-MM-DD, written months, etc.)
18. Translate day names and months to standard format
19. Handle time formats (12h/24h, AM/PM) from any language

GENERAL RULES:
20. Confidence levels:
   - Overall "confidence": Rate the entire extraction (high/medium/low)
   - "field_confidence": Rate EACH field individually based on clarity:
     * "high": Field is clearly visible and unambiguous
     * "medium": Field is present but somewhat unclear or estimated
     * "low": Field is missing, heavily inferred, or very uncertain
   - Example: Clear title but unclear date → title: "high", start_time: "medium"
21. Add warnings array for any uncertainties
22. If a field cannot be determined, use empty string "" or appropriate defaults
23. For nested objects (recurring, registration, organizer), include all fields even if empty
24. For field_confidence, always include all 5 fields (title, start_time, end_time, location, description)
25. Return ONLY the JSON object, no markdown formatting or extra text

Analyze the image now:`;

        const imagePart = {
          inlineData: {
            data: imageData,
            mimeType: mimeType || "image/jpeg",
          },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON response
        const jsonText = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        let eventData;
        try {
          eventData = JSON.parse(jsonText);
        } catch (parseError) {
          logger.error("Failed to parse AI response as JSON:", jsonText);
          throw new Error("AI returned invalid format. Please try again.");
        }

        // Check if this is actually an event poster
        if (eventData.is_event === false) {
          logger.warn("Image is not an event poster:", eventData);
          return res.status(400).json({
            error: {
              code: "NOT_EVENT_IMAGE",
              message: "This doesn't appear to be an event poster. " +
                "Please upload an image of an event flyer, poster, or announcement.",
              details: eventData.warnings?.join(". ") || 
                "The image doesn't contain event information.",
            },
          });
        }

        // Validate that we have actual event data
        const hasCriticalInfo = eventData.start_time && 
          (eventData.title || eventData.location);
        
        if (!hasCriticalInfo) {
          logger.warn("Missing critical event information:", eventData);
          return res.status(400).json({
            error: {
              code: "INCOMPLETE_EVENT_DATA",
              message: "Could not find event date/time in the image. " +
                "Please ensure the image is an event poster with visible date and time.",
              details: eventData.warnings?.join(". ") || 
                "Missing date, time, or title information.",
            },
          });
        }

        // Force confidence to low if missing key fields
        if (!eventData.location || !eventData.title) {
          eventData.confidence = "low";
          if (!eventData.warnings) eventData.warnings = [];
          if (!eventData.location) {
            eventData.warnings.push("Location information not found");
          }
          if (!eventData.title) {
            eventData.warnings.push("Event title unclear");
          }
        }

        logger.info("Successfully extracted event data", {
          confidence: eventData.confidence,
          hasLocation: !!eventData.location,
          hasTitle: !!eventData.title,
        });

        res.json({data: {eventData}});
      } catch (error) {
        logger.error("Error processing image:", error);

        let errorMessage = "Failed to process the image. Please try again.";
        let errorCode = "PROCESSING_ERROR";

        if (error.message?.includes("invalid")) {
          errorCode = "INVALID_IMAGE";
          errorMessage = "The image format is not supported. " +
            "Please use JPG or PNG.";
        } else if (error.message?.includes("size")) {
          errorCode = "IMAGE_TOO_LARGE";
          errorMessage = "The image is too large. " +
            "Please use an image under 4MB.";
        } else if (error.message?.includes("quota")) {
          errorCode = "QUOTA_EXCEEDED";
          errorMessage = "Service is temporarily busy. " +
            "Please try again in a moment.";
        }

        res.status(500).json({
          error: {
            code: errorCode,
            message: errorMessage,
          },
        });
      }
    },
);

// Keep old function for backward compatibility (deprecated)
exports.parseEventText = onRequest(
    {secrets: [geminiApiKey], cors: true},
    async (req, res) => {
      logger.warn("parseEventText is deprecated. Use parseEventImage instead.");
      const text = req.body.data?.text;

      if (!text) {
        return res.status(400).json({
          error: {
            code: "MISSING_TEXT",
            message: "Text is required.",
          },
        });
      }

      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey.value());
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
        });

        const prompt = `Extract event details from this text and return only valid JSON:
{"title":"","start_time":"YYYY-MM-DDTHH:MM","end_time":"YYYY-MM-DDTHH:MM","location":"","description":"","confidence":"medium","warnings":[]}

Text: ${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text()
            .replace(/```json|```/g, "")
            .trim();
        const eventData = JSON.parse(jsonText);

        res.json({data: {eventData}});
      } catch (error) {
        logger.error("Error in parseEventText:", error);
        res.status(500).json({
          error: {
            code: "PROCESSING_ERROR",
            message: "Failed to parse event data.",
          },
        });
      }
    },
);
