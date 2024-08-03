const sendMessageToTab = (tabId, message) => {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      console.log("Error sending message:", chrome.runtime.lastError);
      setTimeout(() => sendMessageToTab(tabId, message), 1000);
    } else {
      console.log("Message sent to tab:", response);
    }
  });
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    sendMessageToTab(tabId, {
      type: "NEW",
      videoId: urlParameters.get("v"),
    });
  }
});

const getEndpointFromStorage = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get('endpoint', (data) => {
      resolve(data.endpoint);
    });
  });
};

const fetchSummary = async (transcriptText) => {
  console.log("Starting fetchSummary function...");
  console.log("Transcript text received:", transcriptText);

  try {
    const endpoint = await getEndpointFromStorage();
    console.log(`Using endpoint from storage: ${endpoint}`);

    const payload = {
      model: "phi3",
      prompt: `Summarize the following text, split by topics, create a title for each topic and create a summary of each topic:\n\n${transcriptText}`,
      stream: false
    };

    console.log("Payload being sent:", JSON.stringify(payload, null, 2));

    console.log("Sending request to endpoint...");
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log("Request sent to the local LLM.");
    console.log("Waiting for LLM generate response...");

    console.log("Response status received:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Parsing response data...");
    const data = await response.json();
    console.log("Received data:", data);

    const summaryText = data.response;
    console.log("Received summary:", summaryText);

    console.log("Sending summary back to content script...");
    chrome.runtime.sendMessage({ action: "loadSummary", summary: summaryText });
  } catch (err) {
    console.error("Error in fetchSummary function:", err);
    console.log("Sending error message back to content script...");
    chrome.runtime.sendMessage({ action: "loadSummary", summary: "An error occurred while generating the summary. Please try again." });
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.action === "fetchSummary") {
    console.log("Action is fetchSummary, calling fetchSummary function...");
    fetchSummary(request.prompt)
      .then(data => {
        console.log("fetchSummary function completed successfully.");
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('Error in message listener:', error);
        sendResponse({ success: false, error: error.toString() });
      });
    return true;  // Indicates that the response is sent asynchronously
  }
  console.log("Action is not fetchSummary, no action taken.");
});

const setLoadingState = (state) => {
  chrome.runtime.sendMessage({ action: "setLoadingState", state: state });
};
