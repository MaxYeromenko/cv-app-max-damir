export function init(mainElement) {
    if (!mainElement)
        return;
    const canvas = mainElement.querySelector("#team-canvas");
    if (!canvas)
        return;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    ctx.fillStyle = "#1b5e20";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f1f1f1";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Team CV Network", canvas.width / 2, canvas.height / 2 + 10);
    ctx.strokeStyle = "#66bb6a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(50, canvas.height / 2);
    ctx.lineTo(150, canvas.height / 2);
    ctx.moveTo(canvas.width - 150, canvas.height / 2);
    ctx.lineTo(canvas.width - 50, canvas.height / 2);
    ctx.stroke();
}
