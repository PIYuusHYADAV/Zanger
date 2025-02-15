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
    window.currentDocument = {
      "Assignment of copyright": {},
    };
  }

  try {
    updatePreview();
    updateKeyEditor();
    console.log("Document initialization completed");
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

// Convert document to HTML
function convertToHtml(document) {
  let html = [];
  const documentTitle = Object.keys(document)[0];

  if (documentTitle) {
    // Wrap document title in strong tag if needed
    html.push(
      `<div class="document-title"><strong>${documentTitle}</strong></div>`
    );
    const mainContent = document[documentTitle];

    // Process sections in order
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
    let sectionClass = isMainSection ? "main-section" : "sub-section";

    if (isMainSection) {
      // Main section titles (bold by default with h5, but wrapping in strong for consistency)
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
        keys = assignmentSectionOrder;
      }
      keys.forEach((subKey) => {
        const subValue = value[subKey];
        const subMarginLeft = marginLeft + 40;
        if (subValue && typeof subValue === "object") {
          if (subValue.content !== undefined) {
            // Removed extra '}' from data-value-path attribute and wrap key in strong
            html.push(
              `<div class="document-line document-content" data-path="${currentPath}.${subKey}.content" style="margin-left: ${subMarginLeft}px;">
                <span data-value-path="${currentPath}.${subKey}.content"><strong>${subKey}:</strong> ${subValue.content}</span>
              </div>`
            );
          } else {
            processSection(subKey, subValue, level + 1, currentPath);
          }
        } else {
          if (typeof subValue === "string" && /^[a-d]:/.test(subKey)) {
            html.push(
              `<div class="document-line document-content list-item" style="margin-left: ${subMarginLeft}px;" data-path="${currentPath}.${subKey}">
                <span>
                  <h5><strong>${subKey}:</strong></h5>
                  <span data-value-path="${currentPath}.${subKey}">${subValue}</span>
                </span>
              </div>`
            );
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
        }
      });
    }
  }
}

// Get ordered paths for key editor (only include editable values)
function getOrderedPaths(obj) {
  let paths = [];
  const documentTitle = Object.keys(obj)[0];

  if (documentTitle) {
    const mainContent = obj[documentTitle];

    // Process sections in order
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
      keys = assignmentSectionOrder;
    }
    keys.forEach((key) => {
      const value = section[key];
      // If the value is an object that has a "content" property, use that as the editable value.
      if (typeof value === "object" && value !== null) {
        if ("content" in value) {
          paths.push({
            path: `${currentPath}.${key}.content`,
            value: value.content,
          });
        } else {
          // Recurse deeper only if there is further nesting that might hold an editable field.
          processSectionForPaths(value, `${currentPath}.${key}`);
        }
      } else if (typeof value === "string") {
        // Include only keys that are directly editable strings.
        paths.push({
          path: `${currentPath}.${key}`,
          value: value,
        });
      }
    });
  }
  return paths;
}

// Update preview
function updatePreview() {
  const preview = document.getElementById("documentPreview");
  if (!preview) {
    console.error("Preview element not found");
    return;
  }

  try {
    const html = convertToHtml(window.currentDocument);
    preview.innerHTML = html;
  } catch (error) {
    console.error("Error updating preview:", error);
    preview.innerHTML =
      '<div class="error">Error loading document preview</div>';
  }
}

// Update key editor (only for keys that have editable values)
function updateKeyEditor() {
  const container = document.getElementById("keyContainer");
  if (!container) {
    console.error("Key container element not found");
    return;
  }

  try {
    // Only include keys that have editable content (as determined by getOrderedPaths)
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
                             ? `<button class="edit-button" onclick="editValue('${path}')">Edit</button>`
                             : `<button class="ai-button" onclick="updateValueWithAI('${path}')">Get AI Suggestion</button>
                            <button class="edit-button" onclick="editValue('${path}')">Edit</button>`
                         }
                        <button class="save-button" onclick="saveValue('${path}')" disabled>Save Changes</button>
                    </div>
                    <div class="error" id="error-${path}" style="display: none;"></div>
                    <div class="success" id="success-${path}" style="display: none;"></div>
                </div>
            </div>
        `;
      })
      .join("");

    container.innerHTML = html;
    // Attach event listener to update save button status on input change
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
function splitPath(path) {
  // Split the full path by dot
  let parts = path.split(".");
  // Find the index of the special key "PARTIES" (if any)
  const specialIndex = parts.findIndex((token) => token.trim() === "PARTIES");

  // If "PARTIES" is not found, process the whole path with merging logic.
  if (specialIndex === -1) {
    return mergeWithRules(parts);
  }

  // Otherwise, process tokens before "PARTIES" with merging logic...
  const leftParts = parts.slice(0, specialIndex);
  const mergedLeft = mergeWithRules(leftParts);

  // And keep the tokens from "PARTIES" onward as is (after trimming).
  const rightParts = parts.slice(specialIndex).map((t) => t.trim());

  return mergedLeft.concat(rightParts);
}

/**
 * Applies merging rules on an array of tokens.
 * - If a token is purely numeric and the next token starts with a non-digit,
 *   merge them with a dot and a space.
 * - If two consecutive tokens are purely numeric, merge them with a dot.
 * Otherwise, leave tokens unchanged.
 */
function mergeWithRules(tokenArray) {
  let result = [];
  for (let i = 0; i < tokenArray.length; i++) {
    let part = tokenArray[i].trim();

    // Look ahead if there is a next part.
    if (i < tokenArray.length - 1) {
      let nextPart = tokenArray[i + 1].trim();

      // Case 1: Current part is numeric and the next part starts with a non-digit
      // (handles cases like "2" and "Definitions")
      if (/^\d+$/.test(part) && /^\D/.test(nextPart)) {
        result.push(part + ". " + nextPart);
        i++; // Skip the next part as it has been merged
        continue;
      }

      // Case 2: Both current and next parts are numeric (handles "2" and "1" to form "2.1")
      if (/^\d+$/.test(part) && /^\d+$/.test(nextPart)) {
        result.push(part + "." + nextPart);
        i++; // Skip the next part as it has been merged
        continue;
      }
    }

    // Otherwise, add the part as is.
    result.push(part);
  }
  return result;
}

/* --- Example Usage --- */

// [
//   "Assignment of Copyright",
//   "PARTIES",
//   "1",
//   "content"
// ]

// Test the function:

// Expected output:
// [
//   "Assignment of Copyright",
//   "ASSIGNMENT",
//   "2. Definitions",
//   "2.1",
//   "Assignment"
// ]

// Save value
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
    // Convert path into an array safely (handles dot notation keys)
    const pathParts = splitPath(path);
    console.log(pathParts);

    let current = window.currentDocument;

    // Navigate to the correct position
    for (let i = 0; i < pathParts.length - 1; i++) {
      let part = pathParts[i].replace(/\["(.*)"\]/, "$1"); // Remove brackets if present
      if (!current[part]) current[part] = {};
      current = current[part];
    }

    // Update value
    let lastPart = pathParts[pathParts.length - 1].replace(/\["(.*)"\]/, "$1");
    console.log(lastPart);
    current[lastPart] = newValue;
    console.log(current[lastPart]);
    console.log(newValue);

    // Update preview display
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

    // Update input fields
    const currentValueInput = document.querySelector(
      `input[data-key="${path}"]`
    );
    if (currentValueInput) {
      currentValueInput.value = newValue;
      currentValueInput.readOnly = true;
      currentValueInput.setAttribute("data-original-value", newValue);
    }

    // Clear AI suggestion
    const suggestionInput = document.querySelector(
      `input[data-ai-suggestion="${path}"]`
    );
    if (suggestionInput) {
      suggestionInput.value = "";
    }

    // Disable save button
    const saveButton = document.querySelector(
      `button.save-button[onclick="saveValue('${path}')"]`
    );
    if (saveButton) {
      saveButton.disabled = true;
    }

    // Show edit button
    if (aiButton) aiButton.style.display = "";
    if (editButton) editButton.style.display = "";

    // Show success message
    const successDiv = document.getElementById(`success-${path}`);
    if (successDiv) {
      successDiv.textContent = "Changes saved successfully";
      successDiv.style.display = "block";
      setTimeout(() => {
        successDiv.style.display = "none";
      }, 3000);
    }

    // Hide error message
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

// Get AI suggestions
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
    if (data.error) {
      throw new Error(data.error);
    }

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
// ... [your existing code above remains unchanged] ...

// Download document as PDF (using the /download endpoint)
async function downloadPdf() {
  console.log(window.currentDocument);
  try {
    const response = await fetch("/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document: window.currentDocument,
        format: "pdf",
      }),
    });

    if (!response.ok) {
      throw new Error("Download failed. Please try again.");
    }
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
  // Retrieve the inner HTML from the document preview panel.
  const content = document.getElementById("documentPreview").innerHTML;

  // Define inline CSS styles for a polished, well-spaced Word document.
  const styles = `
    <style>
      /* Global styling for a clean, professional look */
      body {
        font-family: "Times New Roman", serif;
        font-size: 14px;
        margin: 20px;
        line-height: 1.6;
        color: #333;
        background-color: #fff;
      }
      /* Headings styling */
      h1, h2, h3, h4, h5, h6 {
        color: #2c3e50;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
        margin-top: 20px;
        margin-bottom: 10px;
      }
      /* Paragraph styling */
      p {
        margin: 10px 0;
      }
      /* Table styling, if present */
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
      /* Horizontal rule styling */
      hr {
        border: none;
        border-top: 1px solid #eee;
        margin: 20px 0;
      }
      /* Keys styling: keys are bold and have a right margin */
      .key, strong, b {
        font-weight: bold;
        margin-right: 8px;
      }
      /* Values styling: normal text */
      .value {
        font-weight: normal;
      }
      /* Nested content styling: additional left margin for proper spacing */
      .nested {
        margin-left: 30px;
        margin-top: 5px;
        margin-bottom: 5px;
      }
      /* Optional: spacing for nested keys if they use the .key class */
      .nested .key, .nested strong, .nested b {
        margin-right: 10px;
      }
    </style>
  `;

  // Wrap the content and styles into a full HTML document.
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

  // Create a Blob object with a MIME type recognized by Word.
  const blob = new Blob([htmlContent], { type: "application/msword" });

  // Create a URL for the Blob object.
  const url = URL.createObjectURL(blob);

  // Create a temporary link element.
  const link = document.createElement("a");
  link.href = url;
  link.download = "document.doc"; // This will be the downloaded file's name.

  // Append the link to the document and simulate a click to trigger the download.
  document.body.appendChild(link);
  link.click();

  // Clean up by removing the link and revoking the object URL.
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Download document
