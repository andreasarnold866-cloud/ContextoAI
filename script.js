// Das originale Wörterbuch aus deinem Code bleibt für interne Übersetzungen erhalten
const TRANSLATIONS = {
    'de-DE': {
        char_unit: ' Zeichen', word_unit: 'Wörter', conn_err: 'Fehler bei der Server-Verbindung.',
        grammar_ok: '🎉 Keine Fehler gefunden!', upload_main: 'Klicke hier oder ziehe eine .txt-Datei hinein'
    }
};

let currentLang = 'de-DE';
let latestRawResult = ''; 

// DOM-Elemente sauber referenzieren
const textarea = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
const textOutput = document.getElementById('text-output');
const spinner = document.getElementById('loading-spinner');
const translateBtn = document.getElementById('translate-btn');
const languageSelect = document.getElementById('language-select');

const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const downloadBtn = document.getElementById('downloadBtn');
const speakBtn = document.getElementById('speakBtn');
const micBtn = document.getElementById('micBtn');

// Live-Zähler im Hintergrund aktualisieren
textarea.addEventListener('input', () => { 
    if(charCount) charCount.textContent = textarea.value.trim().length + " Zeichen"; 
});

// FEATURE: Lokales Einlesen von .txt Dateien über fileInput
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            textarea.value = evt.target.result;
            textarea.dispatchEvent(new Event('input'));
        };
        reader.readAsText(file);
    });
}

// FEATURE: Spracheingabe (Speech-to-Text) über das Mikrofon
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;

    if (micBtn) {
        micBtn.addEventListener('click', () => { recognition.start(); });
        recognition.onresult = function(event) {
            const textToken = event.results[0][0].transcript;
            textarea.value += (textarea.value ? " " : "") + textToken;
            textarea.dispatchEvent(new Event('input'));
        };
    }
}

// Hauptfunktion: Senden an deine Netlify Serverless Function
translateBtn.addEventListener('click', async () => {
    const textInput = textarea.value.trim();
    const selectedLanguage = languageSelect.value;

    // CREDIT-SCHUTZ: Verhindert leere oder extrem kurze Klicks vor dem API-Call
    if (!textInput || textInput.length < 3) {
        alert("Bitte gib einen gültigen Text ein (mindestens 3 Zeichen), bevor du übersetzt!");
        return; 
    }

    spinner.classList.remove('hidden');
    textOutput.innerText = "Übersetzung läuft...";
    latestRawResult = '';

    try {
        const response = await fetch('/.netlify/functions/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: textInput,
                language: selectedLanguage
            })
        });

        if (!response.ok) throw new Error("Fehler bei der API-Abfrage.");

        const data = await response.json();
        
        // Speichert das Ergebnis ab für optionale Downloads/Sprachwiedergabe
        latestRawResult = data.translation || data.result;
        textOutput.innerText = latestRawResult;

    } catch (error) {
        console.error(error);
        textOutput.innerText = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
    } finally {
        spinner.classList.add('hidden');
    }
});

// FEATURE: Text vorlesen (Text-to-Speech)
if (speakBtn) {
    speakBtn.addEventListener('click', () => {
        const cleanText = textOutput.innerText;
        if (!cleanText || cleanText.startsWith("Dein Ergebnis") || cleanText.startsWith("Übersetzung läuft")) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Intelligente Spracherkennung für die Ausgabe beim Vorlesen
        const target = languageSelect.value;
        if(target === 'English') utterance.lang = 'en-US';
        else if(target === 'French') utterance.lang = 'fr-FR';
        else if(target === 'Spanish') utterance.lang = 'es-ES';
        else if(target === 'Italian') utterance.lang = 'it-IT';
        else utterance.lang = 'de-DE';
        
        window.speechSynthesis.speak(utterance);
    });
}

// FEATURE: Datei herunterladen (.txt)
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (!latestRawResult) return;
        const blob = new Blob([latestRawResult], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'translation.txt';
        link.click();
    });
}
