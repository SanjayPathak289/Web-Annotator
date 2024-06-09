chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        chrome.tabs.sendMessage(tabId, { action: "NEW", page: tab.url });
    }
});

chrome.runtime.onInstalled.addListener(() => {
    let colors = ["#ff0000", "#0000ff", "#ffff00", "#ffc0cb", "#adff2f"];
    chrome.storage.sync.get("colors", (res) => {
        if (!res["colors"] || res["colors"].length == 0) {
            chrome.storage.sync.set({
                "colors": colors
            });
        }
    })

})