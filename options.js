function loadRegexes() {
  console.log("Regex Extractor: Loading settings");
  browser.storage.local.get(["regexes", "notes", "hotkeyEnabled"]).then((data) => {
    console.log("Regex Extractor: Loaded data:", data);
    const defaultRegexes = [
      "<title>(.+?)(?=(?:\\s*(?: - | :: | \\| | : )\\s*[^<]+)?<\\/title>)",
      "(magnet:\\?xt=urn:[a-z0-9:]+)/i"
    ];
    const defaultNotes = ["Title regex", "Magnet link regex"];
    const regexes = data.regexes && data.regexes.length > 0 ? data.regexes : defaultRegexes;
    const notes = data.notes && data.notes.length === regexes.length ? data.notes : defaultNotes;
    const hotkeyEnabled = data.hotkeyEnabled !== undefined ? data.hotkeyEnabled : false;
    console.log(`Regex Extractor: hotkeyEnabled = ${hotkeyEnabled}`);
    const regexList = document.getElementById("regex-list");
    regexList.innerHTML = "";
    regexes.forEach((regex, index) => {
      const div = document.createElement("div");
      const noteInput = document.createElement("input");
      noteInput.type = "text";
      noteInput.placeholder = "Note (e.g., Title regex)";
      noteInput.value = notes[index] || "";
      noteInput.style.width = "200px";
      noteInput.style.marginRight = "10px";
      const regexInput = document.createElement("input");
      regexInput.type = "text";
      regexInput.value = regex;
      regexInput.style.width = "500px";
      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";
      removeButton.onclick = () => div.remove();
      div.appendChild(noteInput);
      div.appendChild(regexInput);
      div.appendChild(removeButton);
      regexList.appendChild(div);
    });
    document.getElementById("hotkey-toggle").checked = hotkeyEnabled;
    if (data.hotkeyEnabled === undefined) {
      console.log("Regex Extractor: Setting default hotkeyEnabled = false");
      browser.storage.local.set({ hotkeyEnabled: false });
    }
  }).catch((err) => {
    console.error("Regex Extractor: Storage get failed:", err);
    document.getElementById("status").textContent = `Error loading settings: ${err}`;
  });
}

document.getElementById("hotkey-toggle").addEventListener("change", () => {
  const hotkeyEnabled = document.getElementById("hotkey-toggle").checked;
  console.log(`Regex Extractor: Checkbox changed, hotkeyEnabled = ${hotkeyEnabled}`);
  browser.storage.local.set({ hotkeyEnabled }).then(() => {
    console.log("Regex Extractor: Hotkey state saved");
    alert("Hotkey " + (hotkeyEnabled ? "enabled" : "disabled") + ".");
    document.getElementById("status").textContent = "";
  }).catch((err) => {
    console.error("Regex Extractor: Storage set failed:", err);
    document.getElementById("status").textContent = `Error saving hotkey: ${err}`;
  });
});

document.getElementById("add-regex").onclick = () => {
  const regexList = document.getElementById("regex-list");
  const div = document.createElement("div");
  const noteInput = document.createElement("input");
  noteInput.type = "text";
  noteInput.placeholder = "Note (e.g., Title regex)";
  noteInput.style.width = "200px";
  noteInput.style.marginRight = "10px";
  const regexInput = document.createElement("input");
  regexInput.type = "text";
  regexInput.placeholder = "Enter regex (e.g., pattern/i)";
  regexInput.style.width = "500px";
  const removeButton = document.createElement("button");
  removeButton.textContent = "Remove";
  removeButton.onclick = () => div.remove();
  div.appendChild(noteInput);
  div.appendChild(regexInput);
  div.appendChild(removeButton);
  regexList.appendChild(div);
};

document.getElementById("save-regexes").onclick = () => {
  const regexList = document.getElementById("regex-list");
  const divs = regexList.getElementsByTagName("div");
  const regexes = [];
  const notes = [];
  Array.from(divs).forEach((div) => {
    const inputs = div.getElementsByTagName("input");
    if (inputs[1].value.trim() !== "") {
      notes.push(inputs[0].value);
      regexes.push(inputs[1].value);
    }
  });
  console.log("Regex Extractor: Saving regexes:", regexes);
  browser.storage.local.set({ regexes, notes }).then(() => {
    console.log("Regex Extractor: Regexes saved");
    alert("Regexes and notes saved!");
    document.getElementById("status").textContent = "";
  }).catch((err) => {
    console.error("Regex Extractor: Storage set failed:", err);
    document.getElementById("status").textContent = `Error saving regexes: ${err}`;
  });
};

document.getElementById("reset-regexes").onclick = () => {
  if (confirm("Reset to defaults?")) {
    const defaultRegexes = [
      "<title>(.+?)(?=(?:\\s*(?: - | :: | \\| | : )\\s*[^<]+)?<\\/title>)",
      "(magnet:\\?xt=urn:[a-z0-9:]+)/i"
    ];
    console.log("Regex Extractor: Resetting to defaults");
    browser.storage.local.set({
      regexes: defaultRegexes,
      notes: ["Title regex", "Magnet link regex"],
      hotkeyEnabled: false
    }).then(() => {
      loadRegexes();
      alert("Reset to default regexes! Hotkey disabled.");
      document.getElementById("hotkey-toggle").checked = false;
    }).catch((err) => {
      console.error("Regex Extractor: Storage set failed:", err);
      document.getElementById("status").textContent = `Error resetting: ${err}`;
    });
  }
};

document.getElementById("export-regexes").onclick = () => {
  const regexList = document.getElementById("regex-list");
  const divs = regexList.getElementsByTagName("div");
  const regexes = [];
  const notes = [];
  Array.from(divs).forEach((div) => {
    const inputs = div.getElementsByTagName("input");
    if (inputs[1].value.trim() !== "") {
      notes.push(inputs[0].value);
      regexes.push(inputs[1].value);
    }
  });
  const data = { regexes, notes };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "regex-extractor.json";
  a.click();
  URL.revokeObjectURL(url);
  alert("Regexes and notes exported!");
};

document.getElementById("import-regexes").onclick = () => {
  const fileInput = document.getElementById("import-file");
  fileInput.click();
};

document.getElementById("import-file").onchange = (event) => {
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected!");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.regexes) || !Array.isArray(data.notes) || data.regexes.length !== data.notes.length) {
        alert("Invalid JSON format: Must contain 'regexes' and 'notes' arrays of equal length.");
        return;
      }
      console.log("Regex Extractor: Importing regexes:", data.regexes);
      browser.storage.local.set({ regexes: data.regexes, notes: data.notes }).then(() => {
        loadRegexes();
        alert("Regexes and notes imported successfully!");
      }).catch((err) => {
        console.error("Regex Extractor: Storage set failed:", err);
        document.getElementById("status").textContent = `Error importing: ${err}`;
      });
    } catch (err) {
      alert("Invalid JSON file!");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
};

loadRegexes();
