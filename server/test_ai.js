require('dotenv').config();
const { generateAIResponse } = require('./utils/ai');

async function testAI() {
  console.log("Testing AI Response with Llama 3.3 70B...");
  const prompt = "Reply with a simple JSON object: { \"status\": \"success\", \"message\": \"AI is working!\" }. Start your response with { directly.";
  
  try {
    const result = await generateAIResponse(prompt);
    console.log("AI Response Received:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("AI Test Failed:", error.message);
    if (error.response) {
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAI();
