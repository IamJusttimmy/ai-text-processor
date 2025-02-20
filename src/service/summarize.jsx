let summarizerInstance = null;

export async function isSummarizerSupported() {
  return "ai" in window && "summarizer" in window.ai;
}

export async function initializeSummarizer() {
  if (!(await isSummarizerSupported())) {
    console.error("Summarizer API not supported in this browser");
    return null;
  }

  const capabilities = await window.ai.summarizer.capabilities();
  const available = capabilities.available;

  if (available === "no") {
    console.log("Summarizer is not usable.");
    return null;
  }

  const options = {
    type: "key-points",
    format: "text",
    length: "medium",
  };

  try {
    let summarizer;

    if (available === "readily") {
      console.log("Creating readily available summarizer");
      summarizer = await window.ai.summarizer.create(options);
    } else {
      console.log("Downloading summarizer model...");
      summarizer = await window.ai.summarizer.create(options);
      summarizer.addEventListener("downloadprogress", (e) => {
        console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
      });
      await summarizer.ready;
      console.log("Summarizer model downloaded and ready");
    }

    return summarizer;
  } catch (error) {
    console.error("Error initializing summarizer:", error);
    return null;
  }
}

export async function getSummarizer() {
  if (!summarizerInstance) {
    summarizerInstance = await initializeSummarizer();
  }
  return summarizerInstance;
}

export async function summarizeText(text) {
  if (!text || text.trim().length <= 150) {
    console.warn("Text too short for summarization");
    return null;
  }

  const summarizer = await getSummarizer();
  if (!summarizer) {
    console.error("Summarizer not available");
    return null;
  }

  try {
    console.log("Summarizing text:", text.substring(0, 50) + "...");
    const summary = await summarizer.summarize(text);
    console.log("Summarization successful");
    return summary;
  } catch (error) {
    console.error("Summarization failed:", error);
    return null;
  }
}
