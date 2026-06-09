exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { text, modul, language } = JSON.parse(event.body);
        if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'Kein Text vorhanden.' }) };

        let systemPrompt = "Du bist ein präziser Textassistent.";
        
        // Passt sich perfekt an die gewählten Kapseln an!
        if (modul === "Zusammenfassung") {
            systemPrompt = "Fasse den Text kurz und knackig zusammen. Bringe die Kernpunkte auf den Punkt.";
        } else if (modul === "Einfach Erklären") {
            systemPrompt = "Erkläre den folgenden Text so einfach, dass ihn ein Kind problemlos versteht.";
        } else if (modul === "Profi-Stil umschreiben") {
            systemPrompt = "Schreibe den Text in ein elegantes, professionelles Business-Deutsch um.";
        } else if (modul === "Grammatik-Check") {
            systemPrompt = "Prüfe die Grammatik und Rechtschreibung. Gib den korrigierten Text aus und liste Fehler kurz auf.";
        } else if (modul === "Übersetzer" && language) {
            systemPrompt = `Translate the text directly into ${language}. Output ONLY the raw translation without any chat or explanations.`;
        }

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
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ result: data.choices[0].message.content.trim() })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
