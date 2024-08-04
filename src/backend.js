const getEndpointFromStorage = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get('endpoint', (data) => {
      resolve(data.endpoint || 'http://localhost:11434/api/generate');
    });
  });
};

const fetchSummary = async (transcriptText) => {
  console.log("Starting fetchSummary function...");
  try {
    const endpoint = await getEndpointFromStorage();
    console.log(`Using endpoint: ${endpoint}`);

    const payload = {
      model: "phi3",
      prompt: `Summarize the following text, split by topics, create a title for each topic and create a summary of each topic:\n\n${transcriptText}`,
      stream: false
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': chrome.runtime.getURL('')
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (err) {
    console.error("Error in fetchSummary function:", err);
    throw err;
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchSummary") {
    fetchSummary(request.prompt)
      .then(summary => {
        chrome.tabs.sendMessage(sender.tab.id, { action: "loadSummary", summary: summary });
      })
      .catch(error => {
        chrome.tabs.sendMessage(sender.tab.id, { 
          action: "loadSummary", 
          summary: `An error occurred: ${error.message}. Please try again.`
        });
      });
    return true;  // Keeps the message channel open for the asynchronous response
  }
});