import { defineControlUiPlugin } from "openclaw/plugin-sdk/control-ui";
import { createFeatureClient } from "openclaw/plugin-sdk/feature-contract";
import { contract } from "./contract.js";
import { formatPosition } from "./report.js";
import "./control-ui.css";
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isState(value) {
    return value === "idle" || value === "queued" || value === "running";
}
function isCount(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10_000;
}
function isPosition(value) {
    if (!isRecord(value))
        return false;
    return typeof value.available === "boolean" && isState(value.state) && isCount(value.position);
}
function isLane(value) {
    if (!isRecord(value) || !Array.isArray(value.entries))
        return false;
    if (typeof value.available !== "boolean" ||
        !isCount(value.active) ||
        !isCount(value.waiting) ||
        typeof value.truncated !== "boolean") {
        return false;
    }
    return value.entries.every((entry) => isRecord(entry) && typeof entry.label === "string");
}
export default defineControlUiPlugin({
    id: contract.pluginId,
    activate(host) {
        const feature = createFeatureClient(contract, host);
        const cache = new Map();
        const inflight = new Set();
        let selectedKey = "";
        let paintScheduled = false;
        const refreshSession = (sessionKey) => {
            const cleaned = sessionKey.trim();
            if (!cleaned || inflight.has(cleaned) || host.signal.aborted)
                return;
            const cached = cache.get(cleaned);
            if (cached && Date.now() - cached.at < 1000)
                return;
            inflight.add(cleaned);
            void feature.invoke("position", { sessionKey: cleaned }).then((report) => {
                cache.set(cleaned, {
                    report: isPosition(report) ? report : null,
                    error: !isPosition(report),
                    at: Date.now(),
                });
            }, () => {
                cache.set(cleaned, { report: null, error: true, at: Date.now() });
            }).finally(() => {
                inflight.delete(cleaned);
                if (!host.signal.aborted)
                    schedulePaint();
            });
        };
        const currentLabel = () => {
            const cached = cache.get(selectedKey);
            return cached?.report ? formatPosition(cached.report) : "";
        };
        const schedulePaint = () => {
            if (paintScheduled || host.signal.aborted)
                return;
            paintScheduled = true;
            window.requestAnimationFrame(() => {
                paintScheduled = false;
                if (!host.signal.aborted)
                    paintQueueStatus(currentLabel());
            });
        };
        const tick = () => {
            selectedKey = host.sessions.selectedKey.trim();
            if (selectedKey)
                refreshSession(selectedKey);
            schedulePaint();
        };
        const observer = new MutationObserver(() => {
            schedulePaint();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        const stopSubscribe = host.subscribe(tick);
        const timer = window.setInterval(tick, 1000);
        host.signal.addEventListener("abort", () => {
            window.clearInterval(timer);
            observer.disconnect();
            stopSubscribe();
            paintQueueStatus("");
        }, { once: true });
        tick();
        host.ui.registerNavigation({
            id: "queue",
            label: "Warteschlange",
            page: { id: "queue" },
            icon: "list",
        });
        host.ui.registerPage({
            id: "queue",
            label: "Warteschlange",
            mount(container, context) {
                const section = document.createElement("section");
                section.className = "queue-position-page";
                const heading = document.createElement("h1");
                heading.textContent = "Warteschlange";
                const summary = document.createElement("p");
                const list = document.createElement("ol");
                section.append(heading, summary, list);
                container.append(section);
                let disposed = false;
                let request = 0;
                const refresh = async () => {
                    const current = ++request;
                    if (!context.presented || !host.connection.connected)
                        return;
                    try {
                        const report = await feature.invoke("lane", {});
                        if (disposed || current !== request || context.signal.aborted)
                            return;
                        if (!isLane(report))
                            throw new Error("ungültige Antwort");
                        renderLane(summary, list, report);
                    }
                    catch {
                        if (disposed || current !== request || context.signal.aborted)
                            return;
                        summary.textContent = "Warteschlange nicht lesbar";
                        list.replaceChildren();
                    }
                };
                const timer = window.setInterval(() => {
                    void refresh();
                }, 1500);
                void refresh();
                return {
                    dispose() {
                        disposed = true;
                        window.clearInterval(timer);
                        section.remove();
                    },
                };
            },
        });
    },
});
function visibleWorkingStatuses() {
    return [...document.querySelectorAll(".chat-working-indicator__status")].filter((node) => {
        if (!(node instanceof HTMLElement))
            return false;
        const pane = node.closest(".chat-pane-cache__pane");
        return pane === null || pane.classList.contains("chat-pane-cache__pane--visible");
    });
}
function restoreOfficialTokens(status) {
    const official = status.querySelector(":scope > .chat-working-indicator__tokens");
    if (official instanceof HTMLElement)
        official.hidden = false;
    const previous = official?.previousElementSibling;
    if (previous instanceof HTMLElement &&
        !previous.hasAttribute("data-queue-position-sep") &&
        previous.hidden) {
        previous.hidden = false;
    }
}
function paintQueueStatus(label) {
    for (const status of document.querySelectorAll(".chat-working-indicator__status")) {
        restoreOfficialTokens(status);
        const visible = visibleWorkingStatuses().includes(status);
        const mark = status.querySelector(":scope > [data-queue-position]");
        const sep = status.querySelector(":scope > [data-queue-position-sep]");
        if (!visible || !label) {
            mark?.remove();
            sep?.remove();
            continue;
        }
        const separator = sep instanceof HTMLElement ? sep : document.createElement("span");
        separator.dataset.queuePositionSep = "";
        separator.setAttribute("aria-hidden", "true");
        if (separator.textContent !== "·")
            separator.textContent = "·";
        const text = mark instanceof HTMLElement ? mark : document.createElement("span");
        text.dataset.queuePosition = "";
        if (text.textContent !== label)
            text.textContent = label;
        if (separator.parentElement !== status)
            status.append(separator);
        if (text.parentElement !== status)
            status.append(text);
    }
}
function renderLane(summary, list, report) {
    if (!report.available) {
        summary.textContent = "Warteschlange nicht lesbar";
        list.replaceChildren();
        return;
    }
    const waiting = report.waiting === 1 ? "1 wartet" : `${report.waiting} warten`;
    summary.textContent = report.active === 0 ? "keine Anfrage unterwegs" : `1 wird bedient · ${waiting}`;
    list.replaceChildren();
    if (report.entries.length === 0) {
        const item = document.createElement("li");
        item.textContent = "niemand wartet";
        list.append(item);
        return;
    }
    for (const entry of report.entries) {
        const item = document.createElement("li");
        item.textContent = entry.label;
        list.append(item);
    }
    if (report.truncated) {
        const item = document.createElement("li");
        item.textContent = "weitere Einträge nicht angezeigt";
        list.append(item);
    }
}
