// חיפוש בטבלה
function searchTable() {
    var input = document.getElementById("tableNameSearch");
    var filter = input.value.toLowerCase();
    var table = document.getElementById("tripsTable");
    var tr = table.getElementsByTagName("tr");

    for (var i = 1; i < tr.length; i++) {
        var td = tr[i].getElementsByTagName("td")[0];
        if (td) {
            var txtValue = td.textContent || td.innerText;
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

// מיון לפי זמן
var isAsc = true;
function sortTableByTime() {
    var table = document.getElementById("tripsTable");
    var tbody = table.querySelector("tbody");
    var rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort(function(a, b) {
        var timeA = parseFloat(a.getElementsByTagName("td")[2].innerText);
        var timeB = parseFloat(b.getElementsByTagName("td")[2].innerText);
        return isAsc ? timeA - timeB : timeB - timeA;
    });

    isAsc = !isAsc;

    for (var i = 0; i < rows.length; i++) {
        tbody.appendChild(rows[i]);
    }
}

// טעינת מזג אוויר בלייב לכל האזורים בטבלה
function loadTableWeather() {
    var regions = ['north', 'center', 'south'];

    regions.forEach(function(region) {
        fetch('/api/weather?region=' + region)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.success) {
                    var cells = document.querySelectorAll('.weather-cell[data-region="' + region + '"]');
                    cells.forEach(function(cell) {
                        // השינוי נמצא בשורה הזו - הפיכת הסדר של קמ"ש ו-windspeed
                        cell.innerHTML = '☀️ ' + data.temperature + '°C | קמ"ש ' + data.windspeed;
                    });
                }
            })
            .catch(function(err) {
                console.error('שגיאה בטעינת מזג אוויר עבור ' + region, err);
                var cells = document.querySelectorAll('.weather-cell[data-region="' + region + '"]');
                cells.forEach(function(cell) {
                    cell.innerText = 'שגיאה בטעינה';
                });
            });
    });
}

// הרצת אירועים בטעינת הדף
document.addEventListener("DOMContentLoaded", function() {
    var searchInput = document.getElementById("tableNameSearch");
    var sortHeader = document.getElementById("sortTimeHeader");

    if (searchInput) searchInput.addEventListener("keyup", searchTable);
    if (sortHeader) sortHeader.addEventListener("click", sortTableByTime);

    // טעינת מזג האוויר בטבלה
    loadTableWeather();
});