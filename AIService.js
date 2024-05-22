import * as GoogleGenerativeAI from "@google/generative-ai";

const API_KEY=""

//this functions is here to make it easier to switch AIs. 
export const getResponse = async (message) => {
    //You can change the AI used by changing the function here. API KEY is required.
    return await generateResponseGeminiVersion(message)
}

//reaches gemini's AI
const generateResponseGeminiVersion = async (message) => {
    const genAI = new GoogleGenerativeAI.GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    return text;
};

//reaches chatGPT's AI
const generateResponseChatGPTversion = async (message) => {
    try {
        const response = await fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                prompt: message,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error ${response.status}: ${errorData.error.message}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        return error.message;
    }
};

//converts texts into a google seach url
export function textToGoogleSearchURL(text) {
    const encodedText = encodeURIComponent(text);
    const googleSearchURL = `https://www.google.com/search?q=${encodedText}`;

    return googleSearchURL;
}

