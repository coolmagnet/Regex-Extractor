console.log("Regex Extractor: Background script loaded");

browser.contextMenus.create({
  id: "copy-regex-matches",
  title: "Copy Regex Matches",
  contexts: ["all"]
});

browser.contextMenus.create({
  id: "open-regex-prefs",
  title: "Regex Preferences",
  contexts: ["all"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Regex Extractor: Context menu clicked:", info.menuItemId);
  if (info.menuItemId === "copy-regex-matches") {
    browser.tabs.sendMessage(tab.id, { action: "runRegex" }).catch(() => {
      browser.tabs.executeScript(tab.id, { file: "content.js" }).then(() => {
        browser.tabs.sendMessage(tab.id, { action: "runRegex" });
      });
    });
  } else if (info.menuItemId === "open-regex-prefs") {
    browser.runtime.openOptionsPage();
  }
});

browser.browserAction.onClicked.addListener((tab) => {
  console.log("Regex Extractor: Toolbar clicked");
  browser.tabs.sendMessage(tab.id, { action: "runRegex" }).catch(() => {
    browser.tabs.executeScript(tab.id, { file: "content.js" }).then(() => {
      browser.tabs.sendMessage(tab.id, { action: "runRegex" });
    });
  });
});

browser.commands.onCommand.addListener((command) => {
  if (command === "toggle-extension") {
    console.log("Regex Extractor: Hotkey triggered");
    browser.storage.local.get("hotkeyEnabled").then((data) => {
      const enabled = data.hotkeyEnabled === true;
      console.log(`Regex Extractor: hotkeyEnabled = ${enabled}, raw data:`, data);
      if (!enabled) {
        console.log("Regex Extractor: Hotkey disabled, no action");
        return;
      }
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]) {
          browser.tabs.sendMessage(tabs[0].id, { action: "runRegex" }).catch(() => {
            browser.tabs.executeScript(tabs[0].id, { file: "content.js" }).then(() => {
              browser.tabs.sendMessage(tabs[0].id, { action: "runRegex" });
            });
          });
        }
      });
    }).catch((err) => {
      console.error("Regex Extractor: Storage get failed:", err);
      console.log("Regex Extractor: Defaulting to hotkey disabled");
    });
  }
});

browser.runtime.onInstalled.addListener(() => {
  console.log("Regex Extractor: Initializing storage");
  browser.storage.local.set({
    hotkeyEnabled: false,
    regexes: [
      "<title>(.+?)(?=(?:\\s*(?: - | :: | \\| | : )\\s*[^<]+)?<\\/title>)",
      "(magnet:\\?xt=urn:[a-z0-9:]+)/i"
    ],
    notes: ["Title regex", "Magnet link regex"]
  }).then(() => {
    console.log("Regex Extractor: Storage initialized");
  }).catch((err) => {
    console.error("Regex Extractor: Storage init failed:", err);
  });
});
