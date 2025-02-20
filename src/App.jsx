import { useState, useEffect } from "react";
import "./App.css";
import { getDetector, detectLanguage } from "./service/languagaeDetector";
import { supportedLanguages, translateText } from "./service/translator";
import { getSummarizer, summarizeText } from "./service/summarize";

function App() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [detector, setDetector] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [summarizer, setSummarizer] = useState(null);

  // Initialize detector and summary on component mount
  useEffect(() => {
    async function init() {
      const detectorInstance = await getDetector();
      const summarizerInstance = await getSummarizer();
      setDetector(detectorInstance);
      setSummarizer(summarizerInstance);
    }
    init();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return; // Prevent empty messages

    // Add message first with "detecting" state
    const newMessage = {
      text: inputText,
      detectedLang: "detecting...",
      summary: "",
      translated: "",
      isSummarizing: false,
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

    // Set this specific message as translating
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex ? { ...msg, isTranslating: true } : msg
      )
    );

    try {
      // Don't translate if target language is the same as detected language
      if (message.detectedLang === selectedLanguage) {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex
              ? {
                  ...msg,
                  translated: "Text is already in the selected language",
                  isTranslating: false,
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
            idx === messageIndex
              ? { ...msg, translated: translatedText, isTranslating: false }
              : msg
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

  const handleSummarize = async (messageIndex) => {
    const message = messages[messageIndex];
    if (!message || message.isSummarizing) return;

    // Set this specific message as summarizing
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex ? { ...msg, isSummarizing: true } : msg
      )
    );

    try {
      const summary = await summarizeText(message.text);

      if (summary) {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex
              ? {
                  ...msg,
                  summary,
                  isSummarizing: false,
                }
              : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex
              ? {
                  ...msg,
                  summary:
                    "Summarization failed. The text might be too short or the API encountered an error.",
                  isSummarizing: false,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Summarization error:", error);
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === messageIndex
            ? {
                ...msg,
                summary: `Summarization error: ${error.message}`,
                isSummarizing: false,
              }
            : msg
        )
      );
    }
  };

  //Check if text should show summarize button
  const shouldShowSummarizeButton = (message) => {
    return (
      message.text.length > 150 &&
      message.detectedLang === "en" &&
      !message.summary
    );
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

              {/* Summarize button - only for English text > 150 chars */}
              {shouldShowSummarizeButton(msg) && (
                <div className="message-actions">
                  <button
                    onClick={() => handleSummarize(index)}
                    disabled={msg.isSummarizing}
                    className="summarize-btn"
                    aria-label="Summarize text"
                  >
                    {msg.isSummarizing ? "Summarizing..." : "Summarize"}
                  </button>
                </div>
              )}

              {/* Summary display */}
              {msg.summary && (
                <div className="summary-text">
                  <h4>Summary:</h4>
                  <p>{msg.summary}</p>
                </div>
              )}

              <div className="message-actions">
                <select
                  value={msg.selectedLanguage}
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
                  <h4>Translation ({msg.selectedLanguage}):</h4>
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
