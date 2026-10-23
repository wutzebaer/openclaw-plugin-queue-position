export function formatPosition(report) {
    if (!report.available || report.state === "idle")
        return "";
    if (report.state === "running")
        return "läuft";
    if (report.position < 1)
        return "";
    return `Platz ${report.position} in Queue`;
}
