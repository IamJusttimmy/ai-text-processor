export async function initializeLanguageDetector() {
  if (!("ai" in window) || !("languageDetector" in window.ai)) {
    console.error("Chrome AI Language Detector API not available");
    return null;
  }

  const languageDetectorCapabilities =
    await window.ai.languageDetector.capabilities();
  const canDetect = languageDetectorCapabilities.capabilities;

  if (canDetect === "no") {
    console.log("Language detector is not usable.");
    return null;
  }

  let detector;
  if (canDetect === "readily") {
    detector = await window.ai.languageDetector.create();
  } else {
    detector = await window.ai.languageDetector.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
        });
      },
    });
    await detector.ready;
  }

  return detector;
}

// Singleton pattern for detector
let detectorInstance = null;

export async function getDetector() {
  if (!detectorInstance) {
    detectorInstance = await initializeLanguageDetector();
  }
  return detectorInstance;
}

export async function detectLanguage(text) {
  const detector = await getDetector();
  if (!detector) return null;

  try {
    const results = await detector.detect(text);
    if (results && results.length > 0) {
      const topResult = results[0];
      return topResult.detectedLanguage;
    }
    return null;
  } catch (error) {
    console.error("Language detection failed:", error);
    return null;
  }
}
