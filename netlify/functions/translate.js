exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { text, language } = JSON.parse(event.body);

        if (!text || !language) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Fehlende Parameter.' })
            };
        }

        // STRENGER SYSTEM PROMPT FÜR HÖCHSTE CREDIT-SCHONUNG
        const systemPrompt = `You are an elite, professional translator. 
Translate the user's text into ${language}.
CRITICAL RULES FOR CREDIT SAVING:
1. Output ONLY the raw direct translation.
2. Absolutely NO introductory phrases (e.g., do NOT say "Here is your translation:").
3. Absolutely NO chat, explanations, footnotes, or conversational commentary.
4. Keep the exact original formatting, paragraphs, and line breaks.`;

        // Nutzt das in Node 18+ integrierte globale fetch (Beseitigt den Netlify-Buildfehler!)
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash", 
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ],
                temperature: 0.3 
            })
        });

        const data = await response.json();
        const translationResult = data.choices[0].message.content.trim();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ translation: translationResult })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
