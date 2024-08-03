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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchSummary") {
    fetchSummary(request.prompt)
      .then(data => {
        sendResponse({success: true, data: data});
      })
      .catch(error => {
        console.error('Error:', error);
        sendResponse({success: false, error: error.toString()});
      });
    return true;  // Indicates that the response is sent asynchronously
  }
});
