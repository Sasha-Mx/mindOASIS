const axios = require('axios');
require('dotenv').config();

async function test() {
  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: "Hello" }]
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    console.log("SUCCESS:", response.data.choices[0].message.content);
  } catch (error) {
    if (error.response) {
      console.error("ERROR:", error.response.status, error.response.data);
    } else {
      console.error("ERROR:", error.message);
    }
  }
}

test();
