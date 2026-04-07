// ==UserScript==
// @name         Kaden's Developer Console Interface Creator
// @version      2.0
// @author       Kaden
// @grant        none
// ==/UserScript==
(function () {
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
    zIndex: 999999,
    animations: true,
    theme: {
      panelBg: "rgba(16, 18, 22, 0.92)",
      panelBorder: "rgba(255, 255, 255, 0.08)",
      headerBg: "rgba(255,255,255,0.04)",
      inputBg: "rgba(32, 34, 37, 0.95)",
      inputBorder: "rgba(255,255,255,0.12)",
      accent: "rgba(114, 137, 218, 0.95)",
      accentHover: "rgba(88,101,242,0.95)",
      text: "#f8f8f8",
      labelText: "#b9bbbe",
      toastBg: "rgba(30, 33, 37, 0.98)",
      toastBorder: "rgba(255,255,255,0.1)",
      success: "#3ba55d",
      error: "#f04747",
      warning: "#faa61a",
      info: "#5865f2",
    },
    customCss: "",
    keyboardShortcuts: {},
    accessibility: {
      enableAria: true,
      enableFocusManagement: true,
    },
  };

  let currentConfig = deepClone(DEFAULT_CONFIG);
  let theme = deepClone(DEFAULT_CONFIG.theme);
  let activePanels = [];
  let eventListeners = {};
  let shortcuts = {};

  function getGlobal() {
    return typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  }

  function deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => deepClone(item));
    if (typeof obj === "object") {
      const cloned = {};
      Object.keys(obj).forEach((key) => {
        cloned[key] = deepClone(obj[key]);
      });
      return cloned;
    }
  }

  function buildStyles() {
    const animations = currentConfig.animations
      ? `
      .kui-fade-in { animation: kui-fade-in 0.3s ease; }
      .kui-slide-in { animation: kui-slide-in 0.3s ease; }
      .kui-bounce { animation: kui-bounce 0.4s ease; }
      @keyframes kui-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes kui-slide-in { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes kui-bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
    `
      : "";

    return `
      #${ROOT_ID} {
        position: fixed;
        top: ${currentConfig.top};
        left: ${currentConfig.left};
        right: ${currentConfig.right};
        bottom: ${currentConfig.bottom};
        max-width: ${currentConfig.maxWidth};
        z-index: ${currentConfig.zIndex};
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
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      #${ROOT_ID} .kui-panel:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
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
        cursor: move;
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
        transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
      }
      #${ROOT_ID} .kui-button {
        cursor: pointer;
        font-weight: 700;
        border: 1px solid ${theme.accent};
        background: linear-gradient(180deg, ${theme.accent}, ${theme.accentHover});
        color: #fff;
      }
      #${ROOT_ID} .kui-button:hover {
        transform: translateY(-1px);
        background: linear-gradient(180deg, ${theme.accentHover}, ${theme.accent});
      }
      #${ROOT_ID} .kui-button:active {
        transform: translateY(0);
      }
      #${ROOT_ID} .kui-input:focus,
      #${ROOT_ID} .kui-select:focus,
      #${ROOT_ID} .kui-textarea:focus {
        border-color: ${theme.accent};
        box-shadow: 0 0 0 3px rgba(114, 137, 218, 0.12);
      }
      #${ROOT_ID} .kui-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: ${theme.inputBorder};
        outline: none;
      }
      #${ROOT_ID} .kui-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${theme.accent};
        cursor: pointer;
      }
      #${ROOT_ID} .kui-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${theme.accent};
        cursor: pointer;
        border: none;
      }
      #${ROOT_ID} .kui-progress {
        width: 100%;
        height: 8px;
        background: ${theme.inputBorder};
        border-radius: 4px;
        overflow: hidden;
      }
      #${ROOT_ID} .kui-progress-bar {
        height: 100%;
        background: ${theme.accent};
        transition: width 0.3s ease;
      }
      #${ROOT_ID} .kui-tabs {
        display: flex;
        border-bottom: 1px solid ${theme.inputBorder};
      }
      #${ROOT_ID} .kui-tab {
        padding: 8px 16px;
        cursor: pointer;
        background: transparent;
        border: none;
        color: ${theme.labelText};
        transition: color 0.2s ease, border-bottom 0.2s ease;
      }
      #${ROOT_ID} .kui-tab.active {
        color: ${theme.accent};
        border-bottom: 2px solid ${theme.accent};
      }
      #${ROOT_ID} .kui-tab-content {
        display: none;
      }
      #${ROOT_ID} .kui-tab-content.active {
        display: block;
      }
      #${ROOT_ID} .kui-tooltip {
        position: absolute;
        background: ${theme.toastBg};
        color: ${theme.text};
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      #${ROOT_ID} .kui-tooltip.show {
        opacity: 1;
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
        cursor: pointer;
      }
      #${ROOT_ID} .kui-toast.kui-success { border-color: ${theme.success}; }
      #${ROOT_ID} .kui-toast.kui-error { border-color: ${theme.error}; }
      #${ROOT_ID} .kui-toast.kui-warning { border-color: ${theme.warning}; }
      #${ROOT_ID} .kui-toast.kui-info { border-color: ${theme.info}; }
      @keyframes kui-toast-pop {
        from { transform: translateY(10px); opacity: 0 }
        to { transform: translateY(0); opacity: 1 }
      }
      ${animations}
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
    currentConfig = deepMerge(currentConfig, options);
    theme = deepMerge(theme, options.theme || {});
    injectStyles();
    setupKeyboardShortcuts();
    setupAccessibility();
    const root = getRoot();
    Object.assign(root.style, {
      top: currentConfig.top,
      left: currentConfig.left,
      right: currentConfig.right,
      bottom: currentConfig.bottom,
      maxWidth: currentConfig.maxWidth,
      zIndex: currentConfig.zIndex,
      pointerEvents: currentConfig.pointerEvents,
    });
    return root;
  }

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      const key = `${event.ctrlKey ? "ctrl+" : ""}${event.altKey ? "alt+" : ""}${event.shiftKey ? "shift+" : ""}${event.key.toLowerCase()}`;
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    });
  }

  function setupAccessibility() {
    if (currentConfig.accessibility.enableFocusManagement) {
      document.addEventListener("keydown", (event) => {
        if (event.key === "Tab") {
          // Focus management logic
        }
      });
    }
  }

  function createPanel(title, options = {}) {
    const panelConfig = deepMerge({ parent: currentConfig.parent }, options);
    init(panelConfig);
    const panel = document.createElement("div");
    panel.className = "kui-panel";
    if (panelConfig.panelClass) panel.classList.add(panelConfig.panelClass);
    if (panelConfig.panelStyle)
      Object.assign(panel.style, panelConfig.panelStyle);
    if (currentConfig.animations) panel.classList.add("kui-fade-in");

    if (title) {
      const header = document.createElement("div");
      header.className = "kui-header";
      header.textContent = title;
      if (panelConfig.headerStyle)
        Object.assign(header.style, panelConfig.headerStyle);
      if (panelConfig.draggable !== false) makeDraggable(panel, header);
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

    activePanels.push(panel);

    return {
      root: panel,
      body,
      header: title ? header : null,
      append(child) {
        body.appendChild(child);
        return this;
      },
      appendRow(label, child) {
        const row = createRow(label, child);
        body.appendChild(row);
        return this;
      },
      remove() {
        panel.remove();
        activePanels = activePanels.filter((p) => p !== panel);
        return this;
      },
      show() {
        panel.style.display = "";
        return this;
      },
      hide() {
        panel.style.display = "none";
        return this;
      },
      toggle() {
        panel.style.display = panel.style.display === "none" ? "" : "none";
        return this;
      },
    };
  }

  function makeDraggable(panel, handle) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.left = `${startLeft + dx}px`;
      panel.style.top = `${startTop + dy}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
  }

  function createRow(labelText, child) {
    const row = document.createElement("div");
    row.className = "kui-row";
    if (labelText) {
      const label = document.createElement("label");
      label.textContent = labelText;
      if (currentConfig.accessibility.enableAria) {
        label.setAttribute("for", child.id || "");
      }
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
    if (options.tooltip) addTooltip(button, options.tooltip);
    if (options.className) button.classList.add(options.className);
    if (options.style) Object.assign(button.style, options.style);
    if (currentConfig.accessibility.enableAria) {
      button.setAttribute("aria-label", text);
    }
    if (typeof onClick === "function")
      button.addEventListener("click", onClick);
    return button;
  }

  function createInput(placeholder, options = {}) {
    const input = document.createElement("input");
    input.className = "kui-input";
    input.type = options.type || "text";
    input.placeholder = placeholder || "";
    if (options.id) input.id = options.id;
    if (options.value !== undefined) input.value = options.value;
    if (options.tooltip) addTooltip(input, options.tooltip);
    if (options.className) input.classList.add(options.className);
    if (options.style) Object.assign(input.style, options.style);
    if (options.onChange) input.addEventListener("input", options.onChange);
    if (options.onEnter)
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") options.onEnter(event);
      });
    if (currentConfig.accessibility.enableAria) {
      input.setAttribute("aria-label", placeholder);
    }
    return input;
  }

  function createTextarea(placeholder, options = {}) {
    const textarea = document.createElement("textarea");
    textarea.className = "kui-textarea";
    textarea.placeholder = placeholder || "";
    if (options.id) textarea.id = options.id;
    if (options.value !== undefined) textarea.value = options.value;
    if (options.rows) textarea.rows = options.rows;
    if (options.tooltip) addTooltip(textarea, options.tooltip);
    if (options.className) textarea.classList.add(options.className);
    if (options.style) Object.assign(textarea.style, options.style);
    if (options.onChange) textarea.addEventListener("input", options.onChange);
    if (currentConfig.accessibility.enableAria) {
      textarea.setAttribute("aria-label", placeholder);
    }
    return textarea;
  }

  function createSelect(items = [], onChange, options = {}) {
    const select = document.createElement("select");
    select.className = "kui-select";
    if (options.id) select.id = options.id;
    if (options.tooltip) addTooltip(select, options.tooltip);
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
    if (typeof onChange === "function")
      select.addEventListener("change", onChange);
    if (currentConfig.accessibility.enableAria) {
      select.setAttribute("aria-label", "Select option");
    }
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
    if (options.tooltip) addTooltip(wrapper, options.tooltip);
    if (options.className) wrapper.classList.add(options.className);
    if (options.style) Object.assign(wrapper.style, options.style);
    if (typeof onChange === "function")
      checkbox.addEventListener("change", () => onChange(checkbox.checked));
    const label = document.createElement("span");
    label.textContent = labelText || "";
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    if (currentConfig.accessibility.enableAria) {
      checkbox.setAttribute("aria-label", labelText);
    }
    return wrapper;
  }

  function createSlider(
    min = 0,
    max = 100,
    value = 50,
    onChange,
    options = {},
  ) {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "kui-slider";
    slider.min = min;
    slider.max = max;
    slider.value = value;
    if (options.id) slider.id = options.id;
    if (options.tooltip) addTooltip(slider, options.tooltip);
    if (options.className) slider.classList.add(options.className);
    if (options.style) Object.assign(slider.style, options.style);
    if (typeof onChange === "function")
      slider.addEventListener("input", () =>
        onChange(parseFloat(slider.value)),
      );
    if (currentConfig.accessibility.enableAria) {
      slider.setAttribute("aria-valuemin", min);
      slider.setAttribute("aria-valuemax", max);
      slider.setAttribute("aria-valuenow", value);
    }
    return slider;
  }

  function createProgress(value = 0, max = 100, options = {}) {
    const container = document.createElement("div");
    container.className = "kui-progress";
    if (options.className) container.classList.add(options.className);
    if (options.style) Object.assign(container.style, options.style);
    const bar = document.createElement("div");
    bar.className = "kui-progress-bar";
    bar.style.width = `${(value / max) * 100}%`;
    container.appendChild(bar);
    return {
      container,
      bar,
      setValue: (newValue) => (bar.style.width = `${(newValue / max) * 100}%`),
    };
  }

  function createTabs(tabs = [], options = {}) {
    const container = document.createElement("div");
    const tabContainer = document.createElement("div");
    tabContainer.className = "kui-tabs";
    const contentContainer = document.createElement("div");

    tabs.forEach((tab, index) => {
      const tabButton = document.createElement("button");
      tabButton.className = "kui-tab";
      tabButton.textContent = tab.title;
      tabButton.addEventListener("click", () => switchTab(index));
      tabContainer.appendChild(tabButton);

      const tabContent = document.createElement("div");
      tabContent.className = "kui-tab-content";
      if (tab.content) {
        if (typeof tab.content === "string") {
          tabContent.innerHTML = tab.content;
        } else {
          tabContent.appendChild(tab.content);
        }
      }
      contentContainer.appendChild(tabContent);
    });

    container.appendChild(tabContainer);
    container.appendChild(contentContainer);

    function switchTab(index) {
      const tabButtons = tabContainer.querySelectorAll(".kui-tab");
      const tabContents = contentContainer.querySelectorAll(".kui-tab-content");
      tabButtons.forEach((btn, i) => {
        btn.classList.toggle("active", i === index);
      });
      tabContents.forEach((content, i) => {
        content.classList.toggle("active", i === index);
      });
    }

    switchTab(0); // Activate first tab by default

    return container;
  }

  function createLabel(text, options = {}) {
    const label = document.createElement("div");
    label.className = "kui-label";
    label.textContent = text;
    if (options.id) label.id = options.id;
    if (options.tooltip) addTooltip(label, options.tooltip);
    if (options.className) label.classList.add(options.className);
    if (options.style) Object.assign(label.style, options.style);
    return label;
  }

  function addTooltip(element, text) {
    element.title = text; // Simple tooltip using title attribute
    // For advanced tooltips, we could implement custom ones
  }

  function showToast(message, type = "default", duration = 3200) {
    const toast = document.createElement("div");
    toast.className =
      `kui-toast ${type === "success" ? "kui-success" : type === "error" ? "kui-error" : type === "warning" ? "kui-warning" : type === "info" ? "kui-info" : ""}`.trim();
    toast.textContent = message;
    if (currentConfig.animations) toast.classList.add("kui-slide-in");
    document.body.appendChild(toast);
    toast.addEventListener("click", () => toast.remove());
    setTimeout(() => toast.remove(), duration);
    return toast;
  }

  function addKeyboardShortcut(key, callback) {
    shortcuts[key.toLowerCase()] = callback;
  }

  function removeKeyboardShortcut(key) {
    delete shortcuts[key.toLowerCase()];
  }

  function setTheme(customTheme = {}) {
    theme = deepMerge(theme, customTheme);
    injectStyles();
  }

  function updateStyles(cssString) {
    currentConfig.customCss =
      (currentConfig.customCss || "") + "\n" + cssString;
    injectStyles();
  }

  function destroy() {
    const root = document.getElementById(currentConfig.rootId);
    const style = document.getElementById(STYLE_ID);
    if (root) root.remove();
    if (style) style.remove();
    activePanels.forEach((panel) => panel.remove());
    activePanels = [];
    currentConfig = deepClone(DEFAULT_CONFIG);
    theme = deepClone(DEFAULT_CONFIG.theme);
    shortcuts = {};
  }

  function getConfig() {
    return { ...currentConfig, theme: { ...theme } };
  }

  function saveConfig() {
    const config = getConfig();
    localStorage.setItem("kadenUIConfig", JSON.stringify(config));
  }

  function loadConfig() {
    const saved = localStorage.getItem("kadenUIConfig");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        init(config);
      } catch (e) {
        console.warn("Failed to load saved config:", e);
      }
    }
  }

  function deepMerge(target, source) {
    const output = deepClone(target);
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
    createSlider,
    createProgress,
    createTabs,
    createRow,
    createLabel,
    showToast,
    addKeyboardShortcut,
    removeKeyboardShortcut,
    setTheme,
    updateStyles,
    destroy,
    getRoot,
    getConfig,
    saveConfig,
    loadConfig,
  };

  const global = getGlobal();
  global.KadensDeveloperConsoleInterfaceCreator = api;
  global.KadenUI = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
