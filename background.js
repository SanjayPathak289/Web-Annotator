chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        chrome.tabs.sendMessage(tabId, { action: "NEW", page: tab.url });
    }
});

chrome.runtime.onInstalled.addListener(() => {
    let colors = ["red", "blue", "yellow", "pink", "greenyellow"];
    chrome.storage.sync.get("colors", (res) => {
        if (!res["colors"] || res["colors"].length == 0) {
            chrome.storage.sync.set({
                "colors": colors
            });
        }
    })

})