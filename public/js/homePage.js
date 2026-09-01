document.addEventListener("DOMContentLoaded", function () {

    // X / Twitter
    const xShareBtn = document.getElementById("xShareBtn");
    const xPostText = document.getElementById("xPostText");
    const xMessage = document.getElementById("xMessage");

    if (xShareBtn) {
        xShareBtn.addEventListener("click", async function () {
            try {
                const response = await fetch("/posts/share-x", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        text: xPostText.value
                    })
                });

                const data = await response.json();
                xMessage.textContent = data.message;

            } catch (error) {
                console.error(error);
                xMessage.textContent = "שגיאה בחיבור לשרת";
            }
        });
    }

    // Canvas
    const canvas = document.getElementById("travelCanvas");

    if (canvas) {
        const ctx = canvas.getContext("2d");

        // שמיים
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // שמש
        ctx.beginPath();
        ctx.arc(310, 45, 25, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD54F";
        ctx.fill();

        // הר אחורי
        ctx.beginPath();
        ctx.moveTo(20, 170);
        ctx.lineTo(120, 65);
        ctx.lineTo(220, 170);
        ctx.closePath();
        ctx.fillStyle = "#6F8F3D";
        ctx.fill();

        // שלג על ההר
        ctx.beginPath();
        ctx.moveTo(92, 95);
        ctx.lineTo(120, 65);
        ctx.lineTo(145, 92);
        ctx.lineTo(132, 88);
        ctx.lineTo(120, 100);
        ctx.lineTo(110, 88);
        ctx.closePath();
        ctx.fillStyle = "white";
        ctx.fill();

        // הר קדמי
        ctx.beginPath();
        ctx.moveTo(130, 170);
        ctx.lineTo(235, 90);
        ctx.lineTo(355, 170);
        ctx.closePath();
        ctx.fillStyle = "#4F7942";
        ctx.fill();

        // אגם
        ctx.fillStyle = "#4CA6C6";
        ctx.fillRect(0, 170, canvas.width, 70);

        // השתקפות באגם
        ctx.beginPath();
        ctx.moveTo(70, 195);
        ctx.lineTo(180, 195);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(210, 215);
        ctx.lineTo(320, 215);
        ctx.stroke();

        // עץ ראשון
        ctx.fillStyle = "#6D4C41";
        ctx.fillRect(45, 135, 8, 45);

        ctx.beginPath();
        ctx.moveTo(49, 95);
        ctx.lineTo(25, 145);
        ctx.lineTo(73, 145);
        ctx.closePath();
        ctx.fillStyle = "#2E7D32";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(49, 110);
        ctx.lineTo(20, 160);
        ctx.lineTo(78, 160);
        ctx.closePath();
        ctx.fill();

        // עץ שני
        ctx.fillStyle = "#6D4C41";
        ctx.fillRect(320, 145, 7, 35);

        ctx.beginPath();
        ctx.moveTo(323, 110);
        ctx.lineTo(300, 155);
        ctx.lineTo(347, 155);
        ctx.closePath();
        ctx.fillStyle = "#246B35";
        ctx.fill();

        // ציפורים
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(190, 50, 7, Math.PI, 2 * Math.PI);
        ctx.arc(204, 50, 7, Math.PI, 2 * Math.PI);
        ctx.stroke();
    }
});