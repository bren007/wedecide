
import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { StagingInitiative } from '../components/StagingGrid';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Models
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];
const OPENAI_MODEL = "gpt-4o-mini"; // Fast, cheap, reliable

export const useAIMapping = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- HELPER: Gemini Request ---
    const callGemini = async (prompt: string): Promise<string> => {
        if (!GEMINI_API_KEY) throw new Error("No Gemini Key");
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Helper for delay
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (const modelName of GEMINI_MODELS) {
            let retries = 0;
            const maxRetries = 3;

            while (retries <= maxRetries) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    return result.response.text();
                } catch (e) {
                    const err = e as Error;
                    const msg = err.message || "";
                    const is429 = msg.includes("429") || msg.includes("Quota") || msg.includes("rate limit");

                    if (is429) {
                        if (retries < maxRetries) {
                            retries++;
                            // Exponential backoff: 2s, 4s, 8s...
                            const waitTime = Math.pow(2, retries) * 1000 + Math.random() * 500;
                            console.warn(`Gemini ${modelName} 429 (Attempt ${retries}). Retrying in ${waitTime.toFixed(0)}ms...`);
                            await delay(waitTime);
                        } else {
                            console.warn(`Gemini ${modelName} exhausted retries.`);
                            break; // Try next model
                        }
                    } else {
                        // Not a retryable error (e.g. 404), try next model immediately
                        console.warn(`Gemini ${modelName} failed: ${msg}`);
                        break;
                    }
                }
            }
        }
        throw new Error("All Gemini models failed.");
    };

    // --- HELPER: OpenAI Request ---
    const callOpenAI = async (prompt: string): Promise<string> => {
        if (!OPENAI_API_KEY) throw new Error("No OpenAI Key");

        const openai = new OpenAI({
            apiKey: OPENAI_API_KEY,
            dangerouslyAllowBrowser: true // Client-side usage
        });

        const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: "user", content: prompt }],
        });

        return completion.choices[0].message.content || "{}";
    };

    // --- MAIN: Universal AI Caller ---
    const runAI = async (prompt: string): Promise<string> => {
        // 1. Try OpenAI first if available (More reliable for users with keys)
        if (OPENAI_API_KEY) {
            try {
                return await callOpenAI(prompt);
            } catch (e) {
                console.warn("OpenAI failed, falling back to Gemini", e);
            }
        }

        // 2. Try Gemini
        if (GEMINI_API_KEY) {
            return await callGemini(prompt);
        }

        throw new Error("No valid AI API keys found (OpenAI or Gemini).");
    };

    const mapHeaders = async (csvHeaders: string[], samples: Record<string, unknown>[]) => {
        if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
            console.warn("No AI Keys. Using heuristic mapping.");
            return null;
        }

        setIsProcessing(true);
        setError(null);
        try {
            const prompt = `
            You are a data mapping assistant. Map the following CSV headers to our internal schema:
            CSV Headers: ${JSON.stringify(csvHeaders)}
            Sample Data (first 3 rows): ${JSON.stringify(samples)}

            Internal Schema Fields:
            - title
            - description
            - complexity_stakeholder (1, 3, or 5)
            - complexity_tech (1, 3, or 5)
            - complexity_dependency (1, 3, or 5)
            - strategic_pillar_id (UUID)
            - capex_current_fy (number)
            - opex_current_fy (number)
            - total_initiative_cost (number)
            - is_multi_year (boolean)
            - future_annual_opex (number)
            - dependency_count
            - value_drop
            - funding_status
            - strategic_tradeoff

            Return a strict JSON object where keys are CSV headers and values are Internal Schema Fields. 
            Only map if confident. If no match, omit.
            Example: {"Project Name": "title", "Cost FY": "capex_current_fy"}
            Output JSON only.
            `;

            const text = await runAI(prompt);
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr) as Record<string, string>;

        } catch (err) {
            const errorObj = err as Error;
            console.error("AI Mapping Error:", errorObj);
            setError(errorObj.message);
            return null;
        } finally {
            setIsProcessing(false);
        }
    };

    const inferSlotsAndNovelty = async (initiatives: StagingInitiative[], pillars: { id: string, title: string }[] = []) => {
        if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
            setError("Missing AI Keys. Add VITE_OPENAI_API_KEY or VITE_GEMINI_API_KEY.");
            return initiatives;
        }

        setIsProcessing(true);
        try {
            const batchSize = 10;
            const results = [...initiatives];

            // Filter rows that need AI help (missing any complexity OR pillar)
            const toProcessAll = initiatives.filter(row => !row.complexity_stakeholder || !row.complexity_tech || !row.complexity_dependency || !row.strategic_pillar_id);

            for (let i = 0; i < toProcessAll.length; i += batchSize) {
                const batch = toProcessAll.slice(i, i + batchSize);

                const prompt = `
                Analyze the following initiatives and infer:
                1. 'complexity_stakeholder' (1=Internal, 3=Multi-Dept, 5=Ministerial/Public).
                2. 'complexity_tech' (1=BAU, 3=New Integration, 5=First-of-kind/R&D).
                3. 'complexity_dependency' (1=Standalone, 3=1-2 Links, 5=Critical Path for 3+).
                4. 'strategic_pillar_id' (UUID). Choose the BEST match from the provided Pillars list. If no good match, return null.

                Pillars List:
                ${JSON.stringify(pillars)}

                Input Initiatives:
                ${JSON.stringify(batch.map(r => ({ id: r.id, title: r.title, description: r.description })))}

                Return a strict JSON array of objects with 'id', 'complexity_stakeholder', 'complexity_tech', 'complexity_dependency', 'strategic_pillar_id', and 'reasoning'.
                Output strictly valid JSON array.
                `;

                try {
                    const text = await runAI(prompt);
                    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const inferredData = JSON.parse(jsonStr) as Array<{
                        id: string;
                        complexity_stakeholder: number;
                        complexity_tech: number;
                        complexity_dependency: number;
                        strategic_pillar_id: string | null;
                    }>;

                    inferredData.forEach((inf) => {
                        const idx = results.findIndex(r => r.id === inf.id);
                        if (idx !== -1) {
                            results[idx] = {
                                ...results[idx],
                                complexity_stakeholder: results[idx].complexity_stakeholder || inf.complexity_stakeholder,
                                complexity_tech: results[idx].complexity_tech || inf.complexity_tech,
                                complexity_dependency: results[idx].complexity_dependency || inf.complexity_dependency,
                                strategic_pillar_id: results[idx].strategic_pillar_id || inf.strategic_pillar_id,
                                isAiSuggested: true
                            };
                        }
                    });
                    // Tiny delay to be nice to APIs
                    await new Promise(r => setTimeout(r, 500));

                } catch (batchErr) {
                    console.error("Batch failed", batchErr);
                }
            }

            return results;

        } catch (err) {
            const errorObj = err as Error;
            console.error("AI Inference Error:", errorObj);
            setError(errorObj.message);
            return initiatives;
        } finally {
            setIsProcessing(false);
        }
    };

    return { mapHeaders, inferSlotsAndNovelty, isProcessing, error };
};
