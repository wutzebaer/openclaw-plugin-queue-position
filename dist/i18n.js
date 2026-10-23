const english = {
    queue: "Queue",
    running: "running",
    place: (position) => `Place ${position} in queue`,
    unavailable: "Queue unavailable",
    nobodyWaiting: "nobody is waiting",
    noRequest: "no request in flight",
    served: (waiting) => `1 being served · ${waiting === 1 ? "1 waiting" : `${waiting} waiting`}`,
    unassigned: "unassigned",
    more: "further entries not shown",
};
const german = {
    queue: "Warteschlange",
    running: "läuft",
    place: (position) => `Platz ${position} in Queue`,
    unavailable: "Warteschlange nicht lesbar",
    nobodyWaiting: "niemand wartet",
    noRequest: "keine Anfrage unterwegs",
    served: (waiting) => `1 wird bedient · ${waiting === 1 ? "1 wartet" : `${waiting} warten`}`,
    unassigned: "ohne Zuordnung",
    more: "weitere Einträge nicht angezeigt",
};
export function copyFor(locale) {
    const language = (locale ?? "").toLowerCase().split("-")[0];
    return language === "de" ? german : english;
}
export function formatPosition(report, copy) {
    if (!report.available || report.state === "idle")
        return "";
    if (report.state === "running")
        return copy.running;
    if (report.position < 1)
        return "";
    return copy.place(report.position);
}
export function formatLaneEntry(entry, copy) {
    const name = entry.label || copy.unassigned;
    if (entry.state === "running")
        return `${copy.running} · ${name}`;
    return `${copy.place(entry.position)} · ${name}`;
}
