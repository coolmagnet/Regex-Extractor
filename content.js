const defaultRegexes = [
  "<title>(.+?)(?=(?:\\s*(?: - | :: | \\| | : )\\s*[^<]+)?<\\/title>)",
  "(magnet:\\?xt=urn:[a-z0-9:]+)/i"
];

function showMessageBubble(text) {
  const bubble = document.createElement("div");
  bubble.textContent = text;
  bubble.style.position = "fixed";
  bubble.style.top = "10px";
  bubble.style.right = "10px";
  bubble.style.backgroundColor = "#333";
  bubble.style.color = "#fff";
  bubble.style.padding = "10px";
  bubble.style.borderRadius = "5px";
  bubble.style.zIndex = "10000";
  bubble.style.maxWidth = "300px";
  bubble.style.wordWrap = "break-word";
  bubble.style.opacity = "0.9";
  bubble.style.transition = "opacity 0.5s ease";
  bubble.style.fontSize = "16px";
  document.body.appendChild(bubble);
  setTimeout(() => {
    bubble.style.opacity = "0";
    setTimeout(() => bubble.remove(), 500);
  }, 3000);
}

function runRegexMatch() {
  const html = document.documentElement.outerHTML;
  let matches = [];
  browser.storage.local.get("regexes").then((data) => {
    const regexStrings = data.regexes && data.regexes.length > 0 ? data.regexes : defaultRegexes;
    const regexPatterns = regexStrings.map((str) => {
      try {
        const match = str.match(/^(.+?)(?:\/([a-z]*))?$/);
        if (!match) return null;
        return new RegExp(match[1], match[2] || "");
      } catch (e) {
        console.error("Invalid regex:", str, e);
        return null;
      }
    }).filter((r) => r);
    regexPatterns.forEach((regex) => {
      const match = html.match(regex);
      if (match && match[1]) {
        matches.push(match[1]);
      }
    });
    if (matches.length > 0) {
      const textToCopy = matches.join("\n");
      navigator.clipboard.writeText(textToCopy).then(() => {
        showMessageBubble("Copied to clipboard:\n" + textToCopy);
      }).catch((err) => {
        showMessageBubble("Failed to copy: " + err);
      });
    } else {
      showMessageBubble("No matches found for any regex patterns.");
    }
  });
}

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "runRegex") {
    runRegexMatch();
    return Promise.resolve({ status: "done" });
  }
});

runRegexMatch();
