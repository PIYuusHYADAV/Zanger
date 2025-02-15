// Document order configuration
const sectionOrder = [
  "DATE",
  "PARTIES",
  "ASSIGNMENT",
  "EXECUTION",
  "SCHEDULE 1",
];

const assignmentSectionOrder = [
  "2. Definitions",
  "3. Consideration",
  "4. Assignment",
  "5. Moral rights",
  "6. Warranties",
  "7. Indemnity",
  "8. Limits upon exclusions of liability",
  "9. Further assurance",
  "10. General",
  "11. Interpretation",
];

// Initialize document when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Document initialization started");
  if (!window.currentDocument) {
    console.error("No document found in window.currentDocument");
    window.currentDocument = { "Assignment of copyright": {} };
  }
  try {
    updatePreview();
    updateKeyEditor();
    console.log("Document initialization completed");
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

// Convert document object to HTML for preview
function convertToHtml(document) {
  let html = [];
  const documentTitle = Object.keys(document)[0];
  if (documentTitle) {
    html.push(
      `<div class="document-title"><strong>${documentTitle}</strong></div>`
    );
    const mainContent = document[documentTitle];
    sectionOrder.forEach((section) => {
      if (mainContent[section]) {
        processSection(section, mainContent[section], 0, documentTitle);
      }
    });
  }
  return html.join("");
  function processSection(key, value, level, path) {
    const currentPath = path ? `${path}.${key}` : key;
    const isMainSection = sectionOrder.includes(key);
    const marginLeft = level * 20;
    const sectionClass = isMainSection ? "main-section" : "sub-section";
    if (isMainSection) {
      html.push(
        `<div class="document-line ${sectionClass}" data-path="${currentPath}" style="margin-left: ${marginLeft}px;">
           <h5><strong>${key}</strong></h5>
         </div>`
      );
    } else {
      html.push(
        `<div class="document-line ${sectionClass}" data-path="${currentPath}" style="margin-left: ${
          marginLeft + 20
        }px;">
           <h6><strong>${key}</strong></h6>
         </div>`
      );
    }
    if (typeof value === "object" && value !== null) {
      let keys = Object.keys(value);
      if (key === "ASSIGNMENT") {
        const actualKeys = Object.keys(value);
        keys = assignmentSectionOrder
          .filter((k) => actualKeys.includes(k))
          .concat(
            actualKeys.filter((k) => !assignmentSectionOrder.includes(k))
          );
      }
      keys.forEach((subKey) => {
        const subValue = value[subKey];
        const subMarginLeft = marginLeft + 40;
        if (subValue && typeof subValue === "object") {
          if (subValue.content !== undefined) {
            html.push(
              `<div class="document-line document-content" data-path="${currentPath}.${subKey}.content" style="margin-left: ${subMarginLeft}px;">
                <span data-value-path="${currentPath}.${subKey}.content"><strong>${subKey}:</strong> ${subValue.content}</span>
              </div>`
            );
          } else {
            processSection(subKey, subValue, level + 1, currentPath);
          }
        } else {
          html.push(
            `<div class="document-line document-content" data-path="${currentPath}.${subKey}" style="margin-left: ${subMarginLeft}px;">
              <span>
                <strong>${subKey}:</strong>
                <span data-value-path="${currentPath}.${subKey}">${subValue}</span>
              </span>
            </div>`
          );
        }
      });
    }
  }
}

// Save selection for inserted content
let savedRange = null;
const previewElem = document.getElementById("documentPreview");
if (previewElem) {
  previewElem.addEventListener("mouseup", saveSelection);
  previewElem.addEventListener("keyup", saveSelection);
}
function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) savedRange = sel.getRangeAt(0);
}

// Enable editing mode (makes preview editable, but no styling toolbar now)
function enableEditing() {
  const previewElem = document.getElementById("documentPreview");
  if (!previewElem) return;
  previewElem.contentEditable = true;
  previewElem.style.border = "1px dashed #aaa";
  document.getElementById("insertContentButton").style.display = "inline-block";
  document.getElementById("enableEditingButton").style.display = "none";
  // Remove floating toolbar if present (not used now)
  const floatingToolbar = document.getElementById("floatingToolbar");
  if (floatingToolbar) {
    floatingToolbar.style.display = "none";
  }
}

// Open and close modal for inserting new content
function openInsertDialog() {
  document.getElementById("insertDialog").style.display = "block";
  document.getElementById("newKey").focus();
}
function closeInsertDialog() {
  document.getElementById("insertDialog").style.display = "none";
  document.getElementById("documentPreview").focus();
}

// Insert new content with full styling options
function insertNewContent() {
  const key = document.getElementById("newKey").value.trim();
  const value = document.getElementById("newValue").value.trim();
  const keyFontSize =
    document.getElementById("keyFontSize").value.trim() || "16";
  const keyColor = document.getElementById("keyColor").value || "#000000";
  const keyFontFamily = document.getElementById("keyFontFamily").value;
  const keyFontStyle = document.getElementById("keyFontStyle").value;
  const keyFontWeight = document.getElementById("keyFontWeight").value;
  const keyTextDecoration = document.getElementById("keyTextDecoration").value;
  const valueFontSize =
    document.getElementById("valueFontSize").value.trim() || "14";
  const valueColor = document.getElementById("valueColor").value || "#333333";
  const valueFontFamily = document.getElementById("valueFontFamily").value;
  const valueFontStyle = document.getElementById("valueFontStyle").value;
  const valueFontWeight = document.getElementById("valueFontWeight").value;
  const valueTextDecoration = document.getElementById(
    "valueTextDecoration"
  ).value;
  if (key === "" && value === "") {
    alert("Please enter at least a key or a value.");
    return;
  }
  const newPara = document.createElement("p");
  newPara.innerHTML = `
    <span class="key" style="
      font-size: ${keyFontSize}px;
      color: ${keyColor};
      font-family: ${keyFontFamily};
      font-style: ${keyFontStyle};
      font-weight: ${keyFontWeight};
      text-decoration: ${keyTextDecoration};
      ">
      ${key}:
    </span>
    <span class="value" style="
      font-size: ${valueFontSize}px;
      color: ${valueColor};
      font-family: ${valueFontFamily};
      font-style: ${valueFontStyle};
      font-weight: ${valueFontWeight};
      text-decoration: ${valueTextDecoration};
      ">
      ${value}
    </span>
  `;
  const previewElem = document.getElementById("documentPreview");
  if (savedRange && previewElem.contains(savedRange.startContainer)) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    savedRange.deleteContents();
    savedRange.insertNode(newPara);
    savedRange.setStartAfter(newPara);
    savedRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(savedRange);
  } else {
    previewElem.appendChild(newPara);
  }
  newPara.scrollIntoView({ behavior: "smooth" });
  // Reset inputs
  document.getElementById("newKey").value = "";
  document.getElementById("newValue").value = "";
  document.getElementById("keyFontSize").value = "";
  document.getElementById("valueFontSize").value = "";
  document.getElementById("keyColor").value = "#000000";
  document.getElementById("valueColor").value = "#333333";
  document.getElementById("keyFontFamily").selectedIndex = 0;
  document.getElementById("keyFontStyle").selectedIndex = 0;
  document.getElementById("keyFontWeight").selectedIndex = 0;
  document.getElementById("keyTextDecoration").selectedIndex = 0;
  document.getElementById("valueFontFamily").selectedIndex = 0;
  document.getElementById("valueFontStyle").selectedIndex = 0;
  document.getElementById("valueFontWeight").selectedIndex = 0;
  document.getElementById("valueTextDecoration").selectedIndex = 0;
  closeInsertDialog();
}

/* --- Functions for Adding Key-Value Pair under ASSIGNMENT (without styling options) --- */
function openAddKeyValueDialog() {
  document.getElementById("addKeyValueDialog").style.display = "block";
  document.getElementById("newKVKey").focus();
}
function closeAddKeyValueDialog() {
  document.getElementById("addKeyValueDialog").style.display = "none";
  document.getElementById("keyContainer").focus();
}
function addKeyValuePair() {
  const key = document.getElementById("newKVKey").value.trim();
  const value = document.getElementById("newKVValue").value.trim();
  const errorDiv = document.getElementById("addDialogError");
  if (key === "" && value === "") {
    errorDiv.style.display = "block";
    errorDiv.textContent = "Please enter at least a key or a value.";
    return;
  } else {
    errorDiv.style.display = "none";
  }
  const documentTitle = Object.keys(window.currentDocument)[0];
  if (
    !window.currentDocument[documentTitle] ||
    !window.currentDocument[documentTitle]["ASSIGNMENT"]
  ) {
    if (!window.currentDocument[documentTitle]) {
      window.currentDocument[documentTitle] = {};
    }
    window.currentDocument[documentTitle]["ASSIGNMENT"] = {};
  }
  window.currentDocument[documentTitle]["ASSIGNMENT"][key] = { content: value };
  updatePreview();
  updateKeyEditor();
  document.getElementById("newKVKey").value = "";
  document.getElementById("newKVValue").value = "";
  closeAddKeyValueDialog();
}

/* --- Functions for Adding Sub Key-Value Pair (without styling options) --- */
function openAddSubKeyValueDialog() {
  const parentKeySelect = document.getElementById("parentKeySelect");
  parentKeySelect.innerHTML = "";
  const documentTitle = Object.keys(window.currentDocument)[0];
  if (
    window.currentDocument[documentTitle] &&
    window.currentDocument[documentTitle]["ASSIGNMENT"]
  ) {
    const assignmentObj = window.currentDocument[documentTitle]["ASSIGNMENT"];
    Object.keys(assignmentObj).forEach(function (key) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      parentKeySelect.appendChild(option);
    });
  }
  document.getElementById("addSubKeyValueDialog").style.display = "block";
}
function closeAddSubKeyValueDialog() {
  document.getElementById("addSubKeyValueDialog").style.display = "none";
  document.getElementById("keyContainer").focus();
}
function addSubKeyValuePair() {
  const parentKey = document.getElementById("parentKeySelect").value;
  const subKey = document.getElementById("subKey").value.trim();
  const subValue = document.getElementById("subValue").value.trim();
  const errorDiv = document.getElementById("subDialogError");
  if (!parentKey || subKey === "" || subValue === "") {
    errorDiv.style.display = "block";
    errorDiv.textContent =
      "Please select a parent and enter both sub key and sub value.";
    return;
  } else {
    errorDiv.style.display = "none";
  }
  const documentTitle = Object.keys(window.currentDocument)[0];
  if (
    !window.currentDocument[documentTitle] ||
    !window.currentDocument[documentTitle]["ASSIGNMENT"]
  ) {
    alert("ASSIGNMENT section does not exist.");
    return;
  }
  const assignmentObj = window.currentDocument[documentTitle]["ASSIGNMENT"];
  if (!assignmentObj[parentKey]) {
    assignmentObj[parentKey] = {};
  }
  assignmentObj[parentKey][subKey] = { content: subValue };
  updatePreview();
  updateKeyEditor();
  document.getElementById("subKey").value = "";
  document.getElementById("subValue").value = "";
  closeAddSubKeyValueDialog();
}

/* --- Get Ordered Paths for Key Editor --- */
function getOrderedPaths(obj) {
  let paths = [];
  const documentTitle = Object.keys(obj)[0];
  if (documentTitle) {
    const mainContent = obj[documentTitle];
    sectionOrder.forEach((section) => {
      if (mainContent[section]) {
        processSectionForPaths(
          mainContent[section],
          `${documentTitle}.${section}`
        );
      }
    });
  }
  function processSectionForPaths(section, currentPath) {
    if (!section || typeof section !== "object") return;
    let keys = Object.keys(section);
    if (currentPath.endsWith("ASSIGNMENT")) {
      const actualKeys = Object.keys(section);
      keys = assignmentSectionOrder
        .filter((k) => actualKeys.includes(k))
        .concat(actualKeys.filter((k) => !assignmentSectionOrder.includes(k)));
    }
    keys.forEach((key) => {
      const value = section[key];
      if (typeof value === "object" && value !== null) {
        if ("content" in value) {
          paths.push({
            path: `${currentPath}.${key}.content`,
            value: value.content,
          });
        } else {
          processSectionForPaths(value, `${currentPath}.${key}`);
        }
      } else if (typeof value === "string") {
        paths.push({ path: `${currentPath}.${key}`, value: value });
      }
    });
  }
  return paths;
}

/* --- Update Document Preview --- */
function updatePreview() {
  const previewElem = document.getElementById("documentPreview");
  if (!previewElem) {
    console.error("Preview element not found");
    return;
  }
  try {
    const html = convertToHtml(window.currentDocument);
    previewElem.innerHTML = html;
  } catch (error) {
    console.error("Error updating preview:", error);
    previewElem.innerHTML =
      '<div class="error">Error loading document preview</div>';
  }
}

/* --- Update Key Editor --- */
function updateKeyEditor() {
  const container = document.getElementById("keyContainer");
  if (!container) {
    console.error("Key container element not found");
    return;
  }
  try {
    const paths = getOrderedPaths(window.currentDocument);
    const html = paths
      .map(({ path, value }) => {
        const isDateOrParties =
          path.startsWith("Assignment of Copyright.DATE") ||
          path.startsWith("Assignment of Copyright.PARTIES");
        return `
            <div class="key-editor-item">
                <div class="key-path"><strong>${path}</strong></div>
                <div class="value-section">
                    <label>Current Value:</label>
                    <input type="text" class="value-input" value="${
                      value || ""
                    }" readonly data-key="${path}" data-original-value="${
          value || ""
        }">
                    
                    <label>Custom Prompt (optional):</label>
                    <textarea class="prompt-input" placeholder="Enter custom instructions for AI..." data-key="${path}"></textarea>
                    
                    <label>AI Suggestion:</label>
                    <input type="text" class="value-input" data-ai-suggestion="${path}" readonly>
                    
                    <div class="button-group">
                         ${
                           isDateOrParties
                             ? `<button class="btn btn-edit edit-button" onclick="editValue('${path}')">Edit</button>`
                             : `<button class="btn btn-edit ai-button" onclick="updateValueWithAI('${path}')">Get AI Suggestion</button>
                            <button class="btn btn-edit edit-button" onclick="editValue('${path}')">Edit</button>`
                         }
                        <button class="btn btn-edit save-button" onclick="saveValue('${path}')" disabled>Save Changes</button>
                    </div>
                    <div class="error" id="error-${path}" style="display: none;"></div>
                    <div class="success" id="success-${path}" style="display: none;"></div>
                </div>
            </div>
        `;
      })
      .join("");
    container.innerHTML = html;
    document.querySelectorAll(".value-input").forEach((input) => {
      input.addEventListener("input", function () {
        const path = this.getAttribute("data-key");
        const originalValue = this.getAttribute("data-original-value");
        const saveButton = document.querySelector(
          `button.save-button[onclick="saveValue('${path}')"]`
        );
        if (this.value !== originalValue) {
          saveButton.disabled = false;
        } else {
          saveButton.disabled = true;
        }
      });
    });
  } catch (error) {
    console.error("Error updating key editor:", error);
    container.innerHTML = '<div class="error">Error loading key editor</div>';
  }
}

/* --- Edit Value --- */
function editValue(path) {
  const input = document.querySelector(`input[data-key="${path}"]`);
  const editButton = document.querySelector(
    `button.edit-button[onclick="editValue('${path}')"]`
  );
  const saveButton = document.querySelector(
    `button.save-button[onclick="saveValue('${path}')"]`
  );
  const aiButton = document.querySelector(
    `button.ai-button[onclick="updateValueWithAI('${path}')"]`
  );
  input.readOnly = false;
  editButton.style.display = "none";
  if (aiButton) {
    aiButton.style.display = "none";
  }
  if (
    path.startsWith("Assignment of Copyright.DATE") ||
    path.startsWith("Assignment of Copyright.PARTIES")
  ) {
    saveButton.disabled = false;
  }
}

/* --- Utility Functions --- */
function splitPath(path) {
  let parts = path.split(".");
  const specialIndex = parts.findIndex((token) => token.trim() === "PARTIES");
  if (specialIndex === -1) {
    return mergeWithRules(parts);
  }
  const leftParts = parts.slice(0, specialIndex);
  const mergedLeft = mergeWithRules(leftParts);
  const rightParts = parts.slice(specialIndex).map((t) => t.trim());
  return mergedLeft.concat(rightParts);
}
function mergeWithRules(tokenArray) {
  let result = [];
  for (let i = 0; i < tokenArray.length; i++) {
    let part = tokenArray[i].trim();
    if (i < tokenArray.length - 1) {
      let nextPart = tokenArray[i + 1].trim();
      if (/^\d+$/.test(part) && /^\D/.test(nextPart)) {
        result.push(part + ". " + nextPart);
        i++;
        continue;
      }
      if (/^\d+$/.test(part) && /^\d+$/.test(nextPart)) {
        result.push(part + "." + nextPart);
        i++;
        continue;
      }
    }
    result.push(part);
  }
  return result;
}

/* --- Save Value --- */
function saveValue(path) {
  const input = document.querySelector(`input[data-key="${path}"]`);
  const suggestion = document.querySelector(
    `input[data-ai-suggestion="${path}"]`
  )?.value;
  const editButton = document.querySelector(
    `button.edit-button[onclick="editValue('${path}')"]`
  );
  const aiButton = document.querySelector(
    `button.ai-button[onclick="updateValueWithAI('${path}')"]`
  );
  const newValue = suggestion || input.value;
  if (!newValue) return;
  try {
    console.log(path);
    const pathParts = splitPath(path);
    console.log(pathParts);
    let current = window.currentDocument;
    for (let i = 0; i < pathParts.length - 1; i++) {
      let part = pathParts[i].replace(/\["(.*)"\]/, "$1");
      if (!current[part]) current[part] = {};
      current = current[part];
    }
    let lastPart = pathParts[pathParts.length - 1].replace(/\["(.*)"\]/, "$1");
    console.log(lastPart);
    current[lastPart] = newValue;
    console.log(current[lastPart]);
    console.log(newValue);
    const previewElement = document.querySelector(
      `span[data-value-path="${path}"]`
    );
    if (previewElement) {
      let keyLabel = previewElement.querySelector("strong");
      if (keyLabel) {
        keyLabel.nextSibling.nodeValue = " " + newValue;
      } else {
        previewElement.textContent = newValue;
      }
    }
    const currentValueInput = document.querySelector(
      `input[data-key="${path}"]`
    );
    if (currentValueInput) {
      currentValueInput.value = newValue;
      currentValueInput.readOnly = true;
      currentValueInput.setAttribute("data-original-value", newValue);
    }
    const suggestionInput = document.querySelector(
      `input[data-ai-suggestion="${path}"]`
    );
    if (suggestionInput) {
      suggestionInput.value = "";
    }
    const saveButton = document.querySelector(
      `button.save-button[onclick="saveValue('${path}')"]`
    );
    if (saveButton) {
      saveButton.disabled = true;
    }
    if (aiButton) aiButton.style.display = "";
    if (editButton) editButton.style.display = "";
    const successDiv = document.getElementById(`success-${path}`);
    if (successDiv) {
      successDiv.textContent = "Changes saved successfully";
      successDiv.style.display = "block";
      setTimeout(() => {
        successDiv.style.display = "none";
      }, 3000);
    }
    const errorDiv = document.getElementById(`error-${path}`);
    if (errorDiv) errorDiv.style.display = "none";
  } catch (error) {
    console.error("Error saving value:", error);
    const errorDiv = document.getElementById(`error-${path}`);
    if (errorDiv) {
      errorDiv.textContent = "Failed to save changes";
      errorDiv.style.display = "block";
    }
  }
}

/* --- Get AI Suggestions --- */
async function updateValueWithAI(path) {
  const errorDiv = document.getElementById(`error-${path}`);
  const successDiv = document.getElementById(`success-${path}`);
  const currentValue = document.querySelector(
    `input[data-key="${path}"]`
  ).value;
  const customPrompt = document.querySelector(
    `textarea[data-key="${path}"]`
  ).value;
  const suggestionInput = document.querySelector(
    `input[data-ai-suggestion="${path}"]`
  );
  const saveButton = document.querySelector(
    `button.save-button[onclick="saveValue('${path}')"]`
  );
  const editButton = document.querySelector(
    `button.edit-button[onclick="editValue('${path}')"]`
  );
  try {
    const response = await fetch("/update_value", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: path,
        current_value: currentValue,
        custom_prompt: customPrompt,
        document: window.currentDocument,
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    suggestionInput.value = data.value;
    saveButton.disabled = false;
    editButton.style.display = "";
    errorDiv.style.display = "none";
    successDiv.textContent = "AI suggestion generated successfully";
    successDiv.style.display = "block";
  } catch (error) {
    errorDiv.textContent = error.message || "Failed to get AI suggestion";
    errorDiv.style.display = "block";
    successDiv.style.display = "none";
  }
}

/* --- Download Functions --- */
async function downloadPdf() {
  console.log(window.currentDocument);
  try {
    const response = await fetch("/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document: window.currentDocument, format: "pdf" }),
    });
    if (!response.ok) throw new Error("Download failed. Please try again.");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.pdf";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download failed:", error);
    alert(error.message);
  }
}
function downloadWord() {
  const content = document.getElementById("documentPreview").innerHTML;
  const styles = `
    <style>
      body {
        font-family: "Times New Roman", serif;
        font-size: 14px;
        margin: 20px;
        line-height: 1.6;
        color: #333;
        background-color: #fff;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #2c3e50;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
        margin-top: 20px;
        margin-bottom: 10px;
      }
      p {
        margin: 10px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      table, th, td {
        border: 1px solid #ddd;
      }
      th, td {
        padding: 8px;
        text-align: left;
      }
      hr {
        border: none;
        border-top: 1px solid #eee;
        margin: 20px 0;
      }
      .key, strong, b {
        font-weight: bold;
        margin-right: 8px;
      }
      .value {
        font-weight: normal;
      }
      .nested {
        margin-left: 30px;
        margin-top: 5px;
        margin-bottom: 5px;
      }
      .nested .key, .nested strong, .nested b {
        margin-right: 10px;
      }
    </style>
  `;
  const htmlContent = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Document</title>
        ${styles}
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
  const blob = new Blob([htmlContent], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "document.doc";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* --- Expose functions to global scope --- */
window.openAddKeyValueDialog = openAddKeyValueDialog;
window.closeAddKeyValueDialog = closeAddKeyValueDialog;
window.addKeyValuePair = addKeyValuePair;
window.openAddSubKeyValueDialog = openAddSubKeyValueDialog;
window.closeAddSubKeyValueDialog = closeAddSubKeyValueDialog;
window.addSubKeyValuePair = addSubKeyValuePair;
