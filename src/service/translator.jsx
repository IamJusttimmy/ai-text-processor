export const supportedLanguages = [
  { code: "en", name: "English" },
  { code: "pt", name: "Portuguese" },
  { code: "es", name: "Spanish" },
  { code: "ru", name: "Russian" },
  { code: "tr", name: "Turkish" },
  { code: "fr", name: "French" },
];

// Cache for translator instances to avoid recreating
const translatorCache = {};

export async function isTranslatorSupported() {
  return "ai" in window && "translator" in window.ai;
}

export async function getTranslator(sourceLanguage, targetLanguage) {
  if (!(await isTranslatorSupported())) {
    console.error("Translator API not supported in this browser");
    return null;
  }

  const cacheKey = `${sourceLanguage}-${targetLanguage}`;

  // Return cached translator if available
  if (translatorCache[cacheKey]) {
    return translatorCache[cacheKey];
  }

  try {
    // Create a new translator
    const translator = await window.ai.translator.create({
      sourceLanguage,
      targetLanguage,
    });

    // Cache the translator
    translatorCache[cacheKey] = translator;
    return translator;
  } catch (error) {
    console.error("Failed to create translator:", error);
    return null;
  }
}

export async function translateText(text, sourceLanguage, targetLanguage) {
  try {
    const translator = await getTranslator(sourceLanguage, targetLanguage);
    if (!translator) return null;

    const translatedText = await translator.translate(text);
    return translatedText;
  } catch (error) {
    console.error("Translation failed:", error);
    return null;
  }
}
