(() => {
  "use strict";

  const SELECTORS = {
    assistant: '[data-testid="assistant-message"]',
    input: '[data-testid="composer-input"]',
    send: '[data-testid="composer-send-button"]',
    stop: '[data-testid="composer-stop-button"]',
    reasoning: '[data-testid="thinking-status"],[data-testid="subagent-cot-list"]'
  };

  const BUTTON_ID = "meta-bridge-start";
  let responseTimer = null;
  let lastToolPayload = "";

  function visible(el) {
    return !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function readLatestAssistant() {
    const nodes = [...document.querySelectorAll(SELECTORS.assistant)];
    const source = nodes.at(-1);
    if (!source) return "";

    const clone = source.cloneNode(true);
    clone.querySelectorAll(SELECTORS.reasoning).forEach((el) => el.remove());
    return (clone.innerText || clone.textContent || "").trim();
  }

  async function forwardToolCallIfReady() {
    if (document.querySelector(SELECTORS.stop)) return;

    const text = readLatestAssistant();
    if (!text || !/<\s*tool_code\s*>/i.test(text) || !/<\s*\/\s*tool_code\s*>/i.test(text)) {
      return;
    }
    if (text === lastToolPayload) return;
    lastToolPayload = text;

    try {
      await chrome.runtime.sendMessage({
        type: "FETCH_RESPONSE_COMPLETE",
        payload: {
          url: location.origin + "/",
          fullText: text,
          isComplete: true
        }
      });
    } catch (error) {
      console.error("[Meta Bridge] failed to forward tool call", error);
    }
  }

  function scheduleResponseScan() {
    clearTimeout(responseTimer);
    responseTimer = setTimeout(forwardToolCallIfReady, 900);
  }

  function setComposerText(element, value) {
    element.focus();

    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      const proto = element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(element, value);
      else element.value = value;
    } else if (element.isContentEditable) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("insertText", false, value);
    } else {
      throw new Error("Unsupported Meta composer element");
    }

    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: value
    }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function waitForSendButton(timeoutMs = 5000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const button = document.querySelector(SELECTORS.send);
      if (visible(button) && !button.disabled) return button;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  async function startMcpSession(button) {
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = "MCP 준비 중…";

    try {
      const response = await chrome.runtime.sendMessage({
        type: "META_BRIDGE_GET_SYSTEM_PROMPT"
      });
      if (!response?.success || !response.prompt) {
        throw new Error(response?.error || "System Prompt 생성 실패");
      }

      const composer = [...document.querySelectorAll(SELECTORS.input)].find(visible);
      if (!composer) throw new Error("Meta AI 입력창을 찾지 못했습니다.");

      setComposerText(composer, response.prompt);
      const sendButton = await waitForSendButton();
      if (!sendButton) throw new Error("Meta AI 전송 버튼을 찾지 못했습니다.");

      sendButton.click();
      sessionStorage.setItem("meta-bridge-session-path", location.pathname);
      button.textContent = "MCP 연결됨";
    } catch (error) {
      console.error("[Meta Bridge] session bootstrap failed", error);
      button.textContent = "MCP 시작 실패";
      setTimeout(() => { button.textContent = oldText; }, 2500);
    } finally {
      button.disabled = false;
    }
  }

  function mountStartButton() {
    if (document.getElementById(BUTTON_ID)) return;
    if (![...document.querySelectorAll(SELECTORS.input)].some(visible)) return;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = sessionStorage.getItem("meta-bridge-session-path") === location.pathname
      ? "MCP 연결됨"
      : "MCP 시작";
    Object.assign(button.style, {
      position: "fixed",
      right: "18px",
      bottom: "18px",
      zIndex: "2147483647",
      padding: "8px 12px",
      borderRadius: "10px",
      border: "1px solid rgba(127,127,127,.35)",
      background: "rgba(20,20,20,.92)",
      color: "#fff",
      font: "600 12px system-ui, sans-serif",
      cursor: "pointer",
      boxShadow: "0 6px 24px rgba(0,0,0,.2)"
    });
    button.addEventListener("click", () => startMcpSession(button));
    document.documentElement.appendChild(button);
  }

  const observer = new MutationObserver(() => {
    mountStartButton();
    scheduleResponseScan();
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true
  });

  mountStartButton();
  setInterval(mountStartButton, 2000);
})();
