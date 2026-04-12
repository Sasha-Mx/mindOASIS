import api from './api';

export const generateRoadmap = async (answers) => {
  try {
    const res = await api.post('/profile/generate', { answers });
    return res.data;
  } catch (error) {
    console.error("Roadmap generation failed:", error.response?.data || error.message);
    throw new Error('Wait! Something went wrong while calling the AI. Please check your API key.');
  }
};
