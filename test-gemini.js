// Quick test to check available Gemini models
// Run this with: node test-gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY environment variable not set");
    console.log("Set it with: $env:GEMINI_API_KEY='your-key-here' (PowerShell)");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Test different model names
  const modelsToTest = [
    "gemini-1.5-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
    "gemini-1.5-pro-latest"
  ];

  console.log("Testing Gemini API models...\n");

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent("Say 'working' if you can read this");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} - WORKS! Response: ${text.substring(0, 50)}\n`);
    } catch (error) {
      console.log(`❌ ${modelName} - Error: ${error.message.substring(0, 100)}\n`);
    }
  }
}

testGemini();
