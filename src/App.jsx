import { useState, useEffect } from "react";
import "./App.css";
import { getDetector, detectLanguage } from "./service/languagaeDetector";
import { supportedLanguages, translateText } from "./service/translator";

function App() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [detector, setDetector] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Initialize detector on component mount
  useEffect(() => {
    async function initDetector() {
      const detectorInstance = await getDetector();
      setDetector(detectorInstance);
    }
    initDetector();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return; // Prevent empty messages

    // Add message first with "detecting" state
    const newMessage = {
      text: inputText,
      detectedLang: "detecting...",
      summary: "",
      translated: "",
    };

    setMessages([...messages, newMessage]);
    setInputText(""); // Clear input

    // Then detect language
    const lang = await detectLanguage(inputText);

    // Update the message with detected language
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === prev.length - 1
          ? { ...msg, detectedLang: lang || "unknown" }
          : msg
      )
    );
  };

  const handleTranslate = async (messageIndex) => {
    const message = messages[messageIndex];
    if (!message || isTranslating) return;

    setIsTranslating(true);

    try {
      // Don't translate if target language is the same as detected language
      if (message.detectedLang === selectedLanguage) {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex
              ? {
                  ...msg,
                  translated: "Text is already in the selected language",
                }
              : msg
          )
        );
        return;
      }

      const translatedText = await translateText(
        message.text,
        message.detectedLang,
        selectedLanguage
      );

      if (translatedText) {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex ? { ...msg, translated: translatedText } : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex
              ? { ...msg, translated: "Translation failed" }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Translation error:", error);
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === messageIndex
            ? { ...msg, translated: "Translation error" }
            : msg
        )
      );
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <>
      <div className="header">
        <h1>Alexta</h1>
      </div>
      <div className="container">
        <div className="chat-window">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <p>{msg.text}</p>
              <small>Language: {msg.detectedLang}</small>

              <div className="message-actions">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  aria-label="Select translation language"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleTranslate(index)}
                  disabled={isTranslating}
                  aria-label="Translate text"
                >
                  Translate
                </button>
              </div>

              {msg.translated && (
                <div className="translated-text">
                  <h4>Translation ({selectedLanguage}):</h4>
                  <p>{msg.translated}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="input-area">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type here..."
            aria-label="Input text"
          ></textarea>
          <button onClick={handleSend} aria-label="Send message">
            Send
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
