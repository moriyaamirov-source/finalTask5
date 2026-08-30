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
    const canvas = document.getElementById("myCanvas");

    if (canvas) {
        const ctx = canvas.getContext("2d");

        // שמיים
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(0, 0, 300, 150);

        // שמש
        ctx.beginPath();
        ctx.arc(250, 35, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD54F";
        ctx.fill();

        // הר ראשון
        ctx.beginPath();
        ctx.moveTo(20, 130);
        ctx.lineTo(100, 55);
        ctx.lineTo(180, 130);
        ctx.closePath();
        ctx.fillStyle = "#6B8E23";
        ctx.fill();

        // הר שני
        ctx.beginPath();
        ctx.moveTo(120, 130);
        ctx.lineTo(200, 75);
        ctx.lineTo(280, 130);
        ctx.closePath();
        ctx.fillStyle = "#557A3E";
        ctx.fill();
    }

});