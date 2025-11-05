import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const solverModel = 'gemini-2.5-pro'; 
const explainerModel = 'gemini-2.5-pro'; 

const solverSystemInstruction = "You are a world-class mathematics professor and a friendly, encouraging tutor. Your goal is to help students understand how to solve problems, not just give them the answer. For the given math problem, provide a detailed, step-by-step solution. Explain the reasoning and the mathematical principles behind each step in a clear and easy-to-understand way. Use Markdown for formatting, such as lists for steps, and bold text for key terms. If the problem is ambiguous, state your assumptions. Make sure the final output is well-formatted and readable.";

const explainerSystemInstruction = "You are an expert math teacher with a talent for making complex topics simple and engaging. Explain the following mathematical concept clearly and concisely. Use analogies, real-world examples, and simple language to aid understanding. Avoid jargon where possible, or explain it clearly if necessary. Structure your explanation logically and use Markdown for formatting to improve readability.";

interface ImagePart {
    mimeType: string;
    data: string;
}

export const solveMathProblem = async (problem: string, image: ImagePart | null): Promise<string> => {
    const parts: (string | { inlineData: ImagePart })[] = [];
    
    if (image) {
        parts.push({
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        });
    }

    if (problem) {
        parts.push(problem);
    }

    try {
        const response = await ai.models.generateContent({
            model: solverModel,
            contents: { parts: parts.map(p => typeof p === 'string' ? { text: p } : p) },
            config: {
                systemInstruction: solverSystemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error solving math problem:", error);
        throw new Error("Failed to get solution from Gemini API.");
    }
};

export const explainMathConcept = async (concept: string): Promise<string> => {
    const prompt = `Explain the concept of: ${concept}`;

    try {
        const response = await ai.models.generateContent({
            model: explainerModel,
            contents: prompt,
            config: {
                systemInstruction: explainerSystemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error explaining math concept:", error);
        throw new Error("Failed to get explanation from Gemini API.");
    }
};

export const generateSpeech = async (textToSpeak: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech from Gemini API.");
    }
};
