import * as GoogleGenerativeAI from "@google/generative-ai";

const API_KEY="AIzaSyD_zhx-5oWMA-1Y_SjuehItCc5EULeAxyY"

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
    //API_KEY required (they are not free)
    return fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + API_KEY
        },
        body: JSON.stringify({
            "prompt": message,
            "model": "gpt-3.5-turbo",
        })
    }).then(
        (response) => response.json()
    ).then(
        (data) => {
            return data;
        }
    );
};

//converts texts into a google seach url
export function textToGoogleSearchURL(text) {
    const encodedText = encodeURIComponent(text);
    const googleSearchURL = `https://www.google.com/search?q=${encodedText}`;

    return googleSearchURL;
}

