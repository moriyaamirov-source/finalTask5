document.addEventListener("DOMContentLoaded", () => {
    // מציאת הקנבס
    const canvas = document.getElementById("myCanvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        
        // ציור מלבן פשוט
        ctx.fillStyle = "#4a90e2";
        ctx.fillRect(50, 40, 200, 70); 
        
        // כתיבת טקסט בתוך הקנבס
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("הקנבס עובד!", 100, 80);
    }
});