const getEndpointFromStorage = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get('endpoint', (data) => {
      const endpoint = data.endpoint || 'http://localhost:11434/api/generate';
      console.log("Retrieved endpoint:", endpoint);
      resolve(endpoint);
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

    console.log("Sending request with payload:", payload);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'chrome-extension://' + chrome.runtime.id
      },
      body: JSON.stringify(payload)
    });

    console.log("Received response:", response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log("Parsed response data:", data);
    return data.response;
  } catch (err) {
    console.error("Error in fetchSummary function:", err);
    throw err;
  }
};

const testEndpoint = async () => {
  try {
    const endpoint = await getEndpointFromStorage();
    console.log("Testing endpoint:", endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'chrome-extension://' + chrome.runtime.id
      },
      body: JSON.stringify({
        model: "phi3",
        prompt: "Hello, world!",
        stream: false
      })
    });

    console.log("Test response:", response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Test failed! HTTP error! status: ${response.status}, body: ${errorText}`);
      return { success: false, error: `HTTP error! status: ${response.status}, body: ${errorText}` };
    } else {
      const data = await response.json();
      console.log("Test successful! Response data:", data);
      return { success: true, data: data.response };
    }
  } catch (err) {
    console.error("Error testing endpoint:", err);
    return { success: false, error: err.message };
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message in background script:", request);
  if (request.action === "fetchSummary") {
    fetchSummary(request.prompt)
      .then(summary => {
        console.log("Summary generated successfully:", summary);
        chrome.tabs.sendMessage(sender.tab.id, { action: "loadSummary", summary: summary });
      })
      .catch(error => {
        console.error("Error in background script:", error);
        chrome.tabs.sendMessage(sender.tab.id, { 
          action: "loadSummary", 
          summary: `An error occurred: ${error.message}. Please try again.`
        });
      });
    return true;  // Keeps the message channel open for the asynchronous response
  } else if (request.action === "verifyEndpoint") {
    getEndpointFromStorage().then(endpoint => {
      console.log("Current endpoint:", endpoint);
      sendResponse({ endpoint: endpoint });
    });
    return true;  // Keeps the message channel open for the asynchronous response
  } else if (request.action === "testEndpoint") {
    testEndpoint().then(result => {
      sendResponse(result);
    });
    return true;  // Keeps the message channel open for the asynchronous response
  }
});

// Initial test when the background script loads
testEndpoint().then(result => {
  if (result.success) {
    console.log("Initial endpoint test successful:", result.data);
  } else {
    console.error("Initial endpoint test failed:", result.error);
  }
});