chrome.runtime.onMessage.addListener(({ type, name }) => {
    if (type === "set-name") {
        chrome.storage.local.set({ name });
    }
});

chrome.action.onClicked.addListener((tab) => {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "saveHandData" }, function (response) {

        });
    });
});