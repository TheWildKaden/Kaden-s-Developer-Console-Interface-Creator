// ==UserScript==
// @name         Kaden's Developer Console Interface Creator
// @version      1.2
// @author       Kaden
// @grant        none
// ==/UserScript==
;(function () {
  const ROOT_ID = "kadens-dev-console-ui-root";
  const STYLE_ID = "kadens-dev-console-ui-style";

  const DEFAULT_CONFIG = {
    rootId: ROOT_ID,
    parent: null,
    top: "12px",
    left: "12px",
    right: "auto",
    bottom: "auto",
    maxWidth: "360px",
    pointerEvents: "none",
    theme: {
      panelBg: "rgba(16, 18, 22, 0.92)",
      panelBorder: "rgba(255, 255, 255, 0.08)",
      headerBg: "rgba(255,255,255,0.04)",
      inputBg: "rgba(32, 34, 37, 0.95)",
      inputBorder: "rgba(255,255,255,0.12)",
      accent: "rgba(114, 137, 218, 0.95)",
      text: "#f8f8f8",
      labelText: "#b9bbbe",
      toastBg: "rgba(30, 33, 37, 0.98)",
      toastBorder: "rgba(255,255,255,0.1)",
    },
    customCss: "",
  };

  let currentConfig = { ...DEFAULT_CONFIG };
  let theme = { ...DEFAULT_CONFIG.theme };

  function getGlobal() {
    return typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  }

  function buildStyles() {
    return `
      #${ROOT_ID} {
        position: fixed;
        top: ${currentConfig.top};
        left: ${currentConfig.left};
        right: ${currentConfig.right};
        bottom: ${currentConfig.bottom};
        max-width: ${currentConfig.maxWidth};
        z-index: 999999;
        font-family: Arial, Helvetica, sans-serif;
        color: ${theme.text};
        pointer-events: ${currentConfig.pointerEvents};
      }
      #${ROOT_ID} .kui-panel {
        pointer-events: auto;
        background: ${theme.panelBg};
        border: 1px solid ${theme.panelBorder};
        border-radius: 12px;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
        margin-bottom: 12px;
        overflow: hidden;
      }
      #${ROOT_ID} .kui-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.02em;
        background: ${theme.headerBg};
      }
      #${ROOT_ID} .kui-body {
        padding: 12px 14px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      #${ROOT_ID} .kui-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      #${ROOT_ID} .kui-row label {
        flex: 1 1 100%;
        font-size: 12px;
        color: ${theme.labelText};
      }
      #${ROOT_ID} .kui-button,
      #${ROOT_ID} .kui-select,
      #${ROOT_ID} .kui-input,
      #${ROOT_ID} .kui-textarea {
        width: 100%;
        border: 1px solid ${theme.inputBorder};
        border-radius: 8px;
        background: ${theme.inputBg};
        color: ${theme.text};
        font-size: 13px;
        padding: 10px 12px;
        outline: none;
        transition: border-color 0.15s ease, transform 0.15s ease;
      }
      #${ROOT_ID} .kui-button {
        cursor: pointer;
        font-weight: 700;
        border: 1px solid ${theme.accent};
        background: linear-gradient(180deg, ${theme.accent}, rgba(88,101,242,0.95));
        color: #fff;
      }
      #${ROOT_ID} .kui-button:hover {
        transform: translateY(-1px);
      }
      #${ROOT_ID} .kui-input:focus,
      #${ROOT_ID} .kui-select:focus,
      #${ROOT_ID} .kui-textarea:focus {
        border-color: ${theme.accent};
        box-shadow: 0 0 0 3px rgba(114, 137, 218, 0.12);
      }
      #${ROOT_ID} .kui-toast {
        pointer-events: auto;
        position: fixed;
        right: 12px;
        bottom: 12px;
        min-width: 220px;
        max-width: calc(100vw - 24px);
        background: ${theme.toastBg};
        border: 1px solid ${theme.toastBorder};
        border-radius: 10px;
        padding: 12px 14px;
        color: ${theme.text};
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.32);
        animation: kui-toast-pop 0.2s ease;
      }
      #${ROOT_ID} .kui-toast.kui-success { border-color: #3ba55d; }
      #${ROOT_ID} .kui-toast.kui-error { border-color: #f04747; }
      @keyframes kui-toast-pop {
        from { transform: translateY(10px); opacity: 0 }
        to { transform: translateY(0); opacity: 1 }
      }
      ${currentConfig.customCss}
    `;
  }

  function injectStyles() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = buildStyles();
  }

  function getRoot() {
    let root = document.getElementById(currentConfig.rootId);
    if (!root) {
      root = document.createElement("div");
      root.id = currentConfig.rootId;
      document.body.appendChild(root);
    }
    return root;
  }

  function init(options = {}) {
    currentConfig = deepMerge(DEFAULT_CONFIG, options);
    theme = deepMerge(DEFAULT_CONFIG.theme, options.theme || {});
    injectStyles();
    const root = getRoot();
    Object.assign(root.style, {
      top: currentConfig.top,
      left: currentConfig.left,
      right: currentConfig.right,
      bottom: currentConfig.bottom,
      maxWidth: currentConfig.maxWidth,
      pointerEvents: currentConfig.pointerEvents,
    });
    return root;
  }

  function createPanel(title, options = {}) {
    const panelConfig = deepMerge({ parent: currentConfig.parent }, options);
    init(panelConfig);
    const panel = document.createElement("div");
    panel.className = "kui-panel";
    if (panelConfig.panelClass) panel.classList.add(panelConfig.panelClass);
    if (panelConfig.panelStyle) Object.assign(panel.style, panelConfig.panelStyle);

    if (title) {
      const header = document.createElement("div");
      header.className = "kui-header";
      header.textContent = title;
      if (panelConfig.headerStyle) Object.assign(header.style, panelConfig.headerStyle);
      panel.appendChild(header);
    }

    const body = document.createElement("div");
    body.className = "kui-body";
    if (panelConfig.bodyStyle) Object.assign(body.style, panelConfig.bodyStyle);
    panel.appendChild(body);

    if (panelConfig.parent) {
      panelConfig.parent.appendChild(panel);
    } else {
      getRoot().appendChild(panel);
    }

    return {
      root: panel,
      body,
      append(child) {
        body.appendChild(child);
        return this;
      },
      appendRow(label, child) {
        const row = createRow(label, child);
        body.appendChild(row);
        return this;
      },
    };
  }

  function createRow(labelText, child) {
    const row = document.createElement("div");
    row.className = "kui-row";
    if (labelText) {
      const label = document.createElement("label");
      label.textContent = labelText;
      row.appendChild(label);
    }
    row.appendChild(child);
    return row;
  }

  function createButton(text, onClick, options = {}) {
    const button = document.createElement("button");
    button.className = "kui-button";
    button.type = "button";
    button.textContent = text;
    if (options.id) button.id = options.id;
    if (options.title) button.title = options.title;
    if (options.className) button.classList.add(options.className);
    if (options.style) Object.assign(button.style, options.style);
    if (typeof onClick === "function") button.addEventListener("click", onClick);
    return button;
  }

  function createInput(placeholder, options = {}) {
    const input = document.createElement("input");
    input.className = "kui-input";
    input.type = options.type || "text";
    input.placeholder = placeholder || "";
    if (options.id) input.id = options.id;
    if (options.value !== undefined) input.value = options.value;
    if (options.className) input.classList.add(options.className);
    if (options.style) Object.assign(input.style, options.style);
    if (options.onChange) input.addEventListener("input", options.onChange);
    if (options.onEnter) input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") options.onEnter(event);
    });
    return input;
  }

  function createTextarea(placeholder, options = {}) {
    const textarea = document.createElement("textarea");
    textarea.className = "kui-textarea";
    textarea.placeholder = placeholder || "";
    if (options.id) textarea.id = options.id;
    if (options.value !== undefined) textarea.value = options.value;
    if (options.rows) textarea.rows = options.rows;
    if (options.className) textarea.classList.add(options.className);
    if (options.style) Object.assign(textarea.style, options.style);
    if (options.onChange) textarea.addEventListener("input", options.onChange);
    return textarea;
  }

  function createSelect(items = [], onChange, options = {}) {
    const select = document.createElement("select");
    select.className = "kui-select";
    if (options.id) select.id = options.id;
    if (options.className) select.classList.add(options.className);
    if (options.style) Object.assign(select.style, options.style);
    items.forEach((item) => {
      const option = document.createElement("option");
      if (typeof item === "object") {
        option.value = item.value;
        option.textContent = item.label;
        if (item.selected) option.selected = true;
      } else {
        option.value = item;
        option.textContent = item;
      }
      select.appendChild(option);
    });
    if (typeof onChange === "function") select.addEventListener("change", onChange);
    return select;
  }

  function createToggle(labelText, isChecked, onChange, options = {}) {
    const wrapper = document.createElement("label");
    wrapper.className = "kui-row";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "8px";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(isChecked);
    if (options.id) checkbox.id = options.id;
    if (options.className) wrapper.classList.add(options.className);
    if (options.style) Object.assign(wrapper.style, options.style);
    if (typeof onChange === "function") checkbox.addEventListener("change", () => onChange(checkbox.checked));
    const label = document.createElement("span");
    label.textContent = labelText || "";
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    return wrapper;
  }

  function createLabel(text, options = {}) {
    const label = document.createElement("div");
    label.className = "kui-label";
    label.textContent = text;
    if (options.id) label.id = options.id;
    if (options.className) label.classList.add(options.className);
    if (options.style) Object.assign(label.style, options.style);
    return label;
  }

  function showToast(message, type = "default", duration = 3200) {
    const toast = document.createElement("div");
    toast.className = `kui-toast ${type === "success" ? "kui-success" : type === "error" ? "kui-error" : ""}`.trim();
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
    return toast;
  }

  function setTheme(customTheme = {}) {
    theme = deepMerge(theme, customTheme);
    injectStyles();
  }

  function updateStyles(cssString) {
    currentConfig.customCss = (currentConfig.customCss || "") + "\n" + cssString;
    injectStyles();
  }

  function destroy() {
    const root = document.getElementById(currentConfig.rootId);
    const style = document.getElementById(STYLE_ID);
    if (root) root.remove();
    if (style) style.remove();
    currentConfig = { ...DEFAULT_CONFIG };
    theme = { ...DEFAULT_CONFIG.theme };
  }

  function getConfig() {
    return { ...currentConfig, theme: { ...theme } };
  }

  function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  const api = {
    init,
    createPanel,
    createButton,
    createInput,
    createTextarea,
    createSelect,
    createToggle,
    createRow,
    createLabel,
    showToast,
    setTheme,
    updateStyles,
    destroy,
    getRoot,
    getConfig,
  };

  const global = getGlobal();
  global.KadensDeveloperConsoleInterfaceCreator = api;
  global.KadenUI = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();

  function createTextarea(placeholder, options = {}) {
    const textarea = document.createElement("textarea");
    textarea.className = "kui-textarea";
    textarea.placeholder = placeholder || "";
    if (options.id) textarea.id = options.id;
    if (options.value) textarea.value = options.value;
    if (options.rows) textarea.rows = options.rows;
    if (options.onChange) textarea.addEventListener("input", options.onChange);
    return textarea;
  }

  function createSelect(items = [], onChange, options = {}) {
    const select = document.createElement("select");
    select.className = "kui-select";
    if (options.id) select.id = options.id;
    items.forEach((item) => {
      const option = document.createElement("option");
      if (typeof item === "object") {
        option.value = item.value;
        option.textContent = item.label;
        if (item.selected) option.selected = true;
      } else {
        option.value = item;
        option.textContent = item;
      }
      select.appendChild(option);
    });
    if (typeof onChange === "function")
      select.addEventListener("change", onChange);
    return select;
  }

  function createToggle(labelText, isChecked, onChange, options = {}) {
    const wrapper = document.createElement("label");
    wrapper.className = "kui-row";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "8px";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(isChecked);
    if (options.id) checkbox.id = options.id;
    if (typeof onChange === "function")
      checkbox.addEventListener("change", () => onChange(checkbox.checked));
    const label = document.createElement("span");
    label.textContent = labelText || "";
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    return wrapper;
  }

  function showToast(message, type = "default", duration = 3200) {
    const toast = document.createElement("div");
    toast.className =
      `kui-toast ${type === "success" ? "kui-success" : type === "error" ? "kui-error" : ""}`.trim();
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
    return toast;
  }

  const api = {
    init,
    createPanel,
    createButton,
    createInput,
    createTextarea,
    createSelect,
    createToggle,
    createRow,
    showToast,
    getRoot,
  };

  global.KadensDeveloperConsoleInterfaceCreator = api;
  global.KadenUI = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : this);
