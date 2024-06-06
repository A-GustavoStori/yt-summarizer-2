(() => {
  let lastProcessedUrl = '';
  let isLoading = false;

  const setLoadingState = (state) => {
    isLoading = state;
    const summaryButton = document.getElementById('summary-btn');
    if (summaryButton) {
      summaryButton.disabled = state;
      summaryButton.innerHTML = state
        ? `<span class="ant-btn-loading-icon"><span role="img" aria-label="loading" class="anticon anticon-loading anticon-spin"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M988 548H812c-4.4 0-8-3.6-8-8v-76c0-4.4 3.6-8 8-8h109c-13.8-67.4-45.1-128.8-90.7-177.3l-70.2 70.2c-3.1 3.1-8.2 3.1-11.3 0L560.2 269.2c-3.1-3.1-3.1-8.2 0-11.3l70.2-70.2c-48.5-45.6-109.9-76.9-177.3-90.7V216c0 4.4-3.6 8-8 8H484c-4.4 0-8-3.6-8-8V36c0-4.4 3.6-8 8-8h176c4.4 0 8 3.6 8 8v76c0 4.4-3.6 8-8 8H551.5c67.4 13.8 128.8 45.1 177.3 90.7l70.2-70.2c3.1-3.1 8.2-3.1 11.3 0l75.6 75.6c3.1 3.1 3.1 8.2 0 11.3l-70.2 70.2c45.6 48.5 76.9 109.9 90.7 177.3h104.1c4.4 0 8 3.6 8 8v76c0 4.4-3.6 8-8 8z"></path></svg></span> Loading...`
        : 'Get Summary';
    }
  };

  const createUI = () => {
    const extensionContainer = document.createElement('div');
    extensionContainer.id = 'extension-container';

    const header = document.createElement('div');
    header.id = 'header-container';

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL("src/assets/ext-icon.png");
    icon.title = "ext-icon";
    icon.className = "extension-icon";

    const title = document.createElement('p');
    title.textContent = "YouTube Summarizer";
    title.className = "extension-title";

    header.appendChild(icon);
    header.appendChild(title);

    const summaryButton = document.createElement('button');
    summaryButton.id = 'summary-btn';
    summaryButton.textContent = 'Get Summary';
    summaryButton.addEventListener('click', handleSummaryButtonClick);

    const copyButton = document.createElement('button');
    copyButton.id = 'copy-btn';
    copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.1665 2.91663C1.1665 1.95013 1.95001 1.16663 2.9165 1.16663H7.58317C8.54967 1.16663 9.33317 1.95013 9.33317 2.91663V3.49996C9.33317 3.82213 9.072 4.08329 8.74984 4.08329C8.42767 4.08329 8.1665 3.82213 8.1665 3.49996V2.91663C8.1665 2.59446 7.90534 2.33329 7.58317 2.33329H2.9165C2.59434 2.33329 2.33317 2.59446 2.33317 2.91663V7.58329C2.33317 7.90546 2.59434 8.16663 2.9165 8.16663H3.49984C3.822 8.16663 4.08317 8.42779 4.08317 8.74996C4.08317 9.07213 3.822 9.33329 3.49984 9.33329H2.9165C1.95001 9.33329 1.1665 8.54979 1.1665 7.58329V2.91663ZM4.6665 6.41663C4.6665 5.45013 5.45001 4.66663 6.4165 4.66663H11.0832C12.0497 4.66663 12.8332 5.45013 12.8332 6.41663V11.0833C12.8332 12.0498 12.0497 12.8333 11.0832 12.8333H6.4165C5.45001 12.8333 4.6665 12.0498 4.6665 11.0833V6.41663ZM6.4165 5.83329C6.09434 5.83329 5.83317 6.09446 5.83317 6.41663V11.0833C5.83317 11.4055 6.09434 11.6666 6.4165 11.6666H11.0832C11.4053 11.6666 11.6665 11.4055 11.6665 11.0833V6.41663C11.6665 6.09446 11.4053 5.83329 11.0832 5.83329H6.4165Z" fill="currentColor"></path></svg> <span>Copy Summary</span>`;
    copyButton.addEventListener('click', handleCopyButtonClick);

    const summaryContainer = document.createElement('div');
    summaryContainer.id = 'summary-container';

    extensionContainer.appendChild(header);
    extensionContainer.appendChild(summaryButton);
    extensionContainer.appendChild(copyButton);
    extensionContainer.appendChild(summaryContainer);

    // Delay to ensure elements have loaded before inserting the extension container
    setTimeout(() => {
        const secondaryElement = document.getElementById("secondary");
        const secondaryInnerElement = document.getElementById("secondary-inner");
        if (secondaryElement && secondaryInnerElement) {
            secondaryElement.insertBefore(extensionContainer, secondaryInnerElement);
        } else {
            document.body.appendChild(extensionContainer);
        }
    }, 9000); // 9 seconds delay
  };

  const handleSummaryButtonClick = async () => {
    console.log("Summary button clicked");
    setLoadingState(true);
    expandSection();

    setTimeout(() => {
      clickTranscriptionButton();

      setTimeout(() => {
        const transcriptText = getTranscriptText();
        console.log("Fetched transcript text:", transcriptText); // Log fetched transcript
        if (transcriptText.length > 0) {
          fetchSummary(transcriptText);
        } else {
          console.log("Transcript text is empty. Retrying...");
          setTimeout(() => {
            const retryTranscriptText = getTranscriptText();
            console.log("Retry fetched transcript text:", retryTranscriptText); // Log fetched transcript on retry
            if (retryTranscriptText.length > 0) {
              fetchSummary(retryTranscriptText);
            } else {
              console.log("Transcript text is still empty after retry.");
              loadSummary("Transcript not available or failed to load.");
            }
          }, 3000); // Retry after an additional 3 seconds
        }
      }, 3000); // Initial delay to ensure transcription is loaded
    }, 3000); // Delay to ensure section is expanded
  };

  const expandSection = () => {
    const expandButton = document.querySelector("tp-yt-paper-button#expand");
    if (expandButton) {
      expandButton.click();
      console.log("Expand button clicked");
    } else {
      console.log("Expand button not found.");
    }
  };

  const clickTranscriptionButton = () => {
    const transcriptionButton = document.querySelector(".yt-spec-button-shape-next--call-to-action.yt-spec-button-shape-next--outline");
    if (transcriptionButton) {
      transcriptionButton.click();
      console.log("Transcription button clicked");
    } else {
      console.log("Transcription button not found.");
    }
  };

  const fetchSummary = async (transcriptText) => {
    const payload = {
      text: transcriptText
    };

    fetch('http://127.0.0.1:5000/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(response => response.json())
      .then(data => {
        const summaryText = data.summary;
        console.log("Received summary:", summaryText); // Log received summary
        loadSummary(summaryText);
        setLoadingState(false);
      })
      .catch(err => {
        console.error("Error fetching summary:", err);
        setLoadingState(false);
      });
  };

  const getTranscriptText = () => {
    const transcriptSegments = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text');
    console.log("Found transcript segments:", transcriptSegments.length); // Log number of segments found
    let transcriptText = '';
    transcriptSegments.forEach(segment => {
      transcriptText += segment.innerText + ' ';
    });
    return transcriptText.trim();
  };

  const loadSummary = (summary) => {
    const summaryContainer = document.getElementById('summary-container');
    if (!summaryContainer) {
        console.log('Summary container not found.');
        return;
    }

    summaryContainer.innerHTML = ''; // Clear previous summary

    summary.split('\n').forEach(paragraph => {
        const summaryTextElement = document.createElement('p');
        summaryTextElement.textContent = paragraph;
        summaryContainer.appendChild(summaryTextElement);
    });
  };

  const handleCopyButtonClick = () => {
    const summaryContainer = document.getElementById('summary-container');
    if (summaryContainer) {
      const textToCopy = summaryContainer.innerText;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          console.log('Summary copied to clipboard');
        })
        .catch(err => {
          console.error('Error copying summary to clipboard:', err);
        });
    }
  };

  const init = () => {
    createUI();
  };

  init();
})();
