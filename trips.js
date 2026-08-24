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

// חיבור האירועים
document.addEventListener("DOMContentLoaded", function() {
    var searchInput = document.getElementById("tableNameSearch");
    var sortHeader = document.getElementById("sortTimeHeader");

    if (searchInput) searchInput.addEventListener("keyup", searchTable);
    if (sortHeader) sortHeader.addEventListener("click", sortTableByTime);
});