const displayOrder = window.currentDocument.displayOrder || {
  mainSections: [],
  agreementSections: [],
};
const documentTitle = "Consultancy Agreement";

// Initialize document when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
    console.log("Document initialization started");
    if (!window.currentDocument) {
        console.error("No document found in window.currentDocument");
        window.currentDocument = {
            displayOrder: { mainSections: [], agreementSections: [] },
            [documentTitle]: {},
        };
    }
    try {
        // Show questionnaire first
        await showQuestionnaire();

        // Then initialize the editor
        updatePreview();
        updateKeyEditor();
        console.log("Document initialization completed");
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});

// Convert document object to HTML for preview using displayOrder
function convertToHtml(doc) {
  let html = [];
  const mainDoc = doc[documentTitle];
  if (!mainDoc) return "";
  // Add a title
  html.push(
    <div class="document-title"><strong>${documentTitle}</strong></div>
  );

  displayOrder.mainSections.forEach((section) => {
    if (mainDoc[section]) {
      processSection(section, mainDoc[section], 0, documentTitle);
    }
  });
  return html.join("");

  function processSection(key, value, level, path) {
    const currentPath = path ? ${path}.${key} : key;
    const marginLeft = level * 20;
    let sectionClass = level === 0 ? "main-section" : "sub-section";
    // Render section header if content is not directly defined
    if (!value.content) {
      html.push(
        `<div class="document-line ${sectionClass}" data-path="${currentPath}" style="margin-left: ${marginLeft}px;">
             <h${level === 0 ? "5" : "6"}><strong>${key}</strong></h${
          level === 0 ? "5" : "6"
        }>
           </div>`
      );
    }
    // If value is an object, check for ordering (for AGREEMENT, use agreementSections)
    if (typeof value === "object" && value !== null) {
      let keys = Object.keys(value);
      if (key === "AGREEMENT" && displayOrder.agreementSections.length) {
        // Order keys using agreementSections array
        const ordered = displayOrder.agreementSections.filter((k) =>
          keys.includes(k)
        );
        const others = keys.filter(
          (k) => !displayOrder.agreementSections.includes(k)
        );
        keys = ordered.concat(others);
      }
      keys.forEach((subKey) => {
        const subValue = value[subKey];
        const subMarginLeft = marginLeft + 20;
        // If subValue has a "content" property, show it as a line
        if (
          subValue &&
          typeof subValue === "object" &&
          subValue.content !== undefined
        ) {
          html.push(
            `<div class="document-line document-content" data-path="${currentPath}.${subKey}.content" style="margin-left: ${subMarginLeft}px;">
                <span data-value-path="${currentPath}.${subKey}.content"><strong>${subKey}:</strong> ${subValue.content}</span>
              </div>`
          );
        } else if (typeof subValue === "object") {
          processSection(subKey, subValue, level + 1, currentPath);
        } else {
          html.push(
            `<div class="document-line document-content" data-path="${currentPath}.${subKey}" style="margin-left: ${subMarginLeft}px;">
                <span data-value-path="${currentPath}.${subKey}"><strong>${subKey}:</strong> ${subValue}</span>
              </div>`
          );
        }
      });
    } else if (typeof value === "string") {
      // If value is directly a string
      html.push(
        `<div class="document-line document-content" data-path="${currentPath}" style="margin-left: ${marginLeft}px;">
            <span data-value-path="${currentPath}">${value}</span>
          </div>`
      );
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

// Enable editing mode
function enableEditing() {
  const previewElem = document.getElementById("documentPreview");
  if (!previewElem) return;
  previewElem.contentEditable = true;
  previewElem.style.border = "1px dashed #aaa";
  document.getElementById("insertContentButton").style.display = "inline-block";
  document.getElementById("enableEditingButton").style.display = "none";
}

// Open/close insert dialog
function openInsertDialog() {
  document.getElementById("insertDialog").style.display = "block";
  document.getElementById("newKey").focus();
}
function closeInsertDialog() {
  document.getElementById("insertDialog").style.display = "none";
  document.getElementById("documentPreview").focus();
}

// Insert new content with styling options
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
  newPara.innerHTML = `
    <span class="key" style="
        font-size: ${keyFontSize + 'px'};
        color: ${keyColor};
        font-family: ${keyFontFamily};
        font-style: ${keyFontStyle};
        font-weight: ${keyFontWeight};
        text-decoration: ${keyTextDecoration}
    ">
        ${key}:
    </span>
    <span class="value" style="
        font-size: ${valueFontSize + 'px'};
        color: ${valueColor};
        font-family: ${valueFontFamily};
        font-style: ${valueFontStyle};
        font-weight: ${valueFontWeight};
        text-decoration: ${valueTextDecoration}
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

/* --- Key Editor Functions --- */

// Get ordered paths for key editor based on displayOrder
function getOrderedPaths(obj) {
  let paths = [];
  const mainDoc = obj[documentTitle];
  if (!mainDoc) return paths;
  displayOrder.mainSections.forEach((section) => {
    if (mainDoc[section]) {
      processSectionForPaths(mainDoc[section], ${documentTitle}.${section});
    }
  });
  function processSectionForPaths(section, currentPath) {
    if (!section || typeof section !== "object") return;
    let keys = Object.keys(section);
    // For AGREEMENT section, order keys by agreementSections if available
    if (
      currentPath.startsWith(${documentTitle}.AGREEMENT) &&
      displayOrder.agreementSections.length
    ) {
      const ordered = displayOrder.agreementSections.filter((k) =>
        keys.includes(k)
      );
      const others = keys.filter(
        (k) => !displayOrder.agreementSections.includes(k)
      );
      keys = ordered.concat(others);
    }
    keys.forEach((key) => {
      const value = section[key];
      if (typeof value === "object" && value !== null) {
        if ("content" in value) {
          paths.push({
            path: ${currentPath}.${key}.content,
            value: value.content,
          });
        } else {
          processSectionForPaths(value, ${currentPath}.${key});
        }
      } else if (typeof value === "string") {
        paths.push({ path: ${currentPath}.${key}, value: value });
      }
    });
  }
  return paths;
}

// Update Document Preview
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

// Update Key Editor
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
        // For DATE and PARTIES, show only an Edit button; for others, show AI suggestion button as well.
        const isDateOrParties =
          path.startsWith(${documentTitle}.DATE) ||
          path.startsWith(${documentTitle}.1. PARTIES);
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
                               ? <button class="btn btn-edit edit-button" onclick="editValue('${path}')">Edit</button>
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
          button.save-button[onclick="saveValue('${path}')"]
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

// Edit Value
function editValue(path) {
  const input = document.querySelector(input[data-key="${path}"]);
  const editButton = document.querySelector(
    button.edit-button[onclick="editValue('${path}')"]
  );
  const saveButton = document.querySelector(
    button.save-button[onclick="saveValue('${path}')"]
  );
  const aiButton = document.querySelector(
    button.ai-button[onclick="updateValueWithAI('${path}')"]
  );
  input.readOnly = false;
  editButton.style.display = "none";
  if (aiButton) {
    aiButton.style.display = "none";
  }
  saveButton.disabled = false;
}

// Utility: Split and merge path tokens
function splitPath(path) {
  let parts = path.split(".");
  return parts; // In this updated version, we assume dot-separated tokens are sufficient.
}

// Save Value
function saveValue(path) {
  const input = document.querySelector(input[data-key="${path}"]);
  const suggestion = document.querySelector(
    input[data-ai-suggestion="${path}"]
  )?.value;
  const editButton = document.querySelector(
    button.edit-button[onclick="editValue('${path}')"]
  );
  const aiButton = document.querySelector(
    button.ai-button[onclick="updateValueWithAI('${path}')"]
  );
  const newValue = suggestion || input.value;
  if (!newValue) return;
  try {
    const pathParts = splitPath(path);
    let current = window.currentDocument;
    for (let i = 0; i < pathParts.length - 1; i++) {
      let part = pathParts[i];
      if (!current[part]) current[part] = {};
      current = current[part];
    }
    let lastPart = pathParts[pathParts.length - 1];
    current[lastPart] = newValue;
    const previewElement = document.querySelector(
      span[data-value-path="${path}"]
    );
    if (previewElement) {
      let keyLabel = previewElement.querySelector("strong");
      if (keyLabel) {
        keyLabel.nextSibling.nodeValue = " " + newValue;
      } else {
        previewElement.textContent = newValue;
      }
    }
    input.value = newValue;
    input.readOnly = true;
    input.setAttribute("data-original-value", newValue);
    const suggestionInput = document.querySelector(
      input[data-ai-suggestion="${path}"]
    );
    if (suggestionInput) {
      suggestionInput.value = "";
    }
    const saveButton = document.querySelector(
      button.save-button[onclick="saveValue('${path}')"]
    );
    if (saveButton) {
      saveButton.disabled = true;
    }
    if (aiButton) aiButton.style.display = "";
    if (editButton) editButton.style.display = "";
    const successDiv = document.getElementById(success-${path});
    if (successDiv) {
      successDiv.textContent = "Changes saved successfully";
      successDiv.style.display = "block";
      setTimeout(() => {
        successDiv.style.display = "none";
      }, 3000);
    }
    const errorDiv = document.getElementById(error-${path});
    if (errorDiv) errorDiv.style.display = "none";
  } catch (error) {
    console.error("Error saving value:", error);
    const errorDiv = document.getElementById(error-${path});
    if (errorDiv) {
      errorDiv.textContent = "Failed to save changes";
      errorDiv.style.display = "block";
    }
  }
}

// Get AI Suggestions
async function updateValueWithAI(path) {
  const errorDiv = document.getElementById(error-${path});
  const successDiv = document.getElementById(success-${path});
  const currentValue = document.querySelector(
    input[data-key="${path}"]
  ).value;
  const customPrompt = document.querySelector(
    textarea[data-key="${path}"]
  ).value;
  const suggestionInput = document.querySelector(
    input[data-ai-suggestion="${path}"]
  );
  const saveButton = document.querySelector(
    button.save-button[onclick="saveValue('${path}')"]
  );
  const editButton = document.querySelector(
    button.edit-button[onclick="editValue('${path}')"]
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

// Download functions
async function downloadPdf() {
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
function downloadWordDocx() {
  const content = document.getElementById("documentPreview").innerHTML;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Document</title>
        <style>
          /* Global Styling */
          body {
            font-family: Verdana;
            font-size: 14px;
            line-height: 1.8;
            color: #333;
            background-color: #fff;
            margin: 20px;
          }
          /* Headings: All headings are set to 12px, no underline */
          h1, h2, h3, h4, h5, h6 {
            font-family: Verdana;
            font-size: 12px;
            color: #2c3e50;
            margin: 25px 0 15px;
            
          }
          /* Paragraphs */
          p {
            margin: 15px 0;
          }
          /* Lists */
          ul, ol {
            margin: 15px 0;
            padding-left: 40px;
          }
          li {
            margin-bottom: 10px;
          }
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th, td {
            padding: 10px;
            text-align: left;
          }
          /* Horizontal Rule */
          hr {
            border: none;
           
            margin: 30px 0;
          }
          /* Emphasized Text (Keys) */
          .key, strong, b {
            font-weight: bold;
            margin-right: 15px;
            display: inline-block;
            min-width: 120px;
          }
          .value {
            font-weight: normal;
          }
          /* Nested Content */
          .nested {
            margin-left: 30px;
            margin-top: 10px;
            margin-bottom: 10px;
            padding-left: 10px;
            border-left: 2px dashed #ddd;
          }
          /* Nested Keys: Ensure vertical spacing without modifying HTML structure */
          .nested .key,
          .nested strong,
          .nested b {
            display: block;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;

  // Convert HTML to DOCX Blob using html-docx-js
  const converted = htmlDocx.asBlob(html);

  // Create a download link and trigger download
  const url = URL.createObjectURL(converted);
  const link = document.createElement("a");
  link.href = url;
  link.download = "document.docx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* --- Functions for Adding Key-Value Pair under AGREEMENT --- */
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
  // For AGREEMENT, add key-value under the AGREEMENT section
  if (!window.currentDocument[documentTitle]["AGREEMENT"]) {
    window.currentDocument[documentTitle]["AGREEMENT"] = {};
  }
  window.currentDocument[documentTitle]["AGREEMENT"][key] = { content: value };
  updatePreview();
  updateKeyEditor();
  document.getElementById("newKVKey").value = "";
  document.getElementById("newKVValue").value = "";
  closeAddKeyValueDialog();
}

/* --- Functions for Adding Sub Key-Value Pair --- */
function openAddSubKeyValueDialog() {
  const parentKeySelect = document.getElementById("parentKeySelect");
  parentKeySelect.innerHTML = "";
  const agreementSection = window.currentDocument[documentTitle]["AGREEMENT"];
  if (agreementSection) {
    Object.keys(agreementSection).forEach(function (key) {
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
  if (!window.currentDocument[documentTitle]["AGREEMENT"]) {
    alert("AGREEMENT section does not exist.");
    return;
  }
  const agreementObj = window.currentDocument[documentTitle]["AGREEMENT"];
  if (!agreementObj[parentKey]) {
    agreementObj[parentKey] = {};
  }
  agreementObj[parentKey][subKey] = { content: subValue };
  updatePreview();
  updateKeyEditor();
  document.getElementById("subKey").value = "";
  document.getElementById("subValue").value = "";
  closeAddSubKeyValueDialog();
}
// Questionnaire functions
async function showQuestionnaire() {
    try {
        // Generate questions
        const response = await fetch('/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: window.currentDocument })
        });

        if (!response.ok) throw new Error('Failed to generate questions');

        const questions = await response.json();

        // Create HTML for questions
        const questionsHtml = Object.entries(questions).map(([key, question]) => `
            <div class="question-item" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">${question}</label>
                <input type="text" class="question-input" data-key="${key}" style="width: 100%; padding: 8px;">
            </div>
        `).join('');

        // Insert questions into modal
        document.getElementById('questionsContainer').innerHTML = questionsHtml;

        // Show modal
        document.getElementById('questionnaireModal').style.display = 'block';

    } catch (error) {
        console.error('Error showing questionnaire:', error);
        // If there's an error, skip questionnaire and show editor
        closeQuestionnaireModal();
    }
}

function closeQuestionnaireModal() {
    document.getElementById('questionnaireModal').style.display = 'none';
}

async function submitQuestionnaire() {
    try {
        // Collect answers
        const answers = {};
        document.querySelectorAll('.question-input').forEach(input => {
            answers[input.dataset.key] = input.value.trim();
        });

        // Get questions from inputs
        const questions = {};
        document.querySelectorAll('.question-input').forEach(input => {
            questions[input.dataset.key] = input.previousElementSibling.textContent;
        });

        // Submit answers
        const response = await fetch('/fill-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                document: window.currentDocument,
                questions,
                answers
            })
        });

        if (!response.ok) throw new Error('Failed to process answers');

        // Update document with filled template
        const filledTemplate = await response.json();
        window.currentDocument = filledTemplate;

        // Close modal and update editor
        closeQuestionnaireModal();
        updatePreview();
        updateKeyEditor();

    } catch (error) {
        console.error('Error submitting questionnaire:', error);
        alert('Error processing answers. Please try again or skip the questionnaire.');
    }
}
/* --- Expose functions to global scope --- */
window.openAddKeyValueDialog = openAddKeyValueDialog;
window.closeAddKeyValueDialog = closeAddKeyValueDialog;
window.addKeyValuePair = addKeyValuePair;
window.openAddSubKeyValueDialog = openAddSubKeyValueDialog;
window.closeAddSubKeyValueDialog = closeAddSubKeyValueDialog;
window.addSubKeyValuePair = addSubKeyValuePair;
window.closeQuestionnaireModal = closeQuestionnaireModal;
window.submitQuestionnaire = submitQuestionnaire;
