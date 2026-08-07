// 0 = libero, 1 = occupato
function createMatrix(rows, cols) {
    if (rows === void 0) { rows = 8; }
    if (cols === void 0) { cols = 10; }
    return Array.from({ length: rows }, function () { return Array(cols).fill(0); });
}
function countFreeSeats(matrix) {
    return matrix.flat().filter(function (cell) { return cell === 0; }).length;
}
function countOccupiedSeats(matrix) {
    return matrix.flat().filter(function (cell) { return cell === 1; }).length;
}
function bookFirstAvailableSeat(matrix) {
    for (var row = 0; row < matrix.length; row++) {
        for (var col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] === 0) {
                matrix[row][col] = 1;
                return "(".concat(row, ".").concat(col, ")");
            }
        }
    }
    return "nessuna";
}
function run() {
    var matrix = createMatrix();
    console.log("Matrice iniziale:");
    console.table(matrix);
    console.log("Totale liberi:", countFreeSeats(matrix));
    console.log("Totale occupati:", countOccupiedSeats(matrix));
    process.stdout.write("Vuoi prenotare il primo posto libero? (si/no): ");
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", function (raw) {
        var input = raw.trim().toLowerCase();
        if (input === "si" || input === "s") {
            var bookedPosition = bookFirstAvailableSeat(matrix);
            if (bookedPosition === "nessuna") {
                console.log("Nessun posto disponibile");
            }
            else {
                console.log("Posto prenotato in posizione ".concat(bookedPosition));
            }
        }
        else if (input === "no" || input === "n") {
            console.log("Prenotazione annullata");
        }
        else {
            console.log('Risposta non valida: scrivi "si" o "no"');
        }
        console.log("Matrice aggiornata:");
        console.table(matrix);
        console.log("Totale liberi:", countFreeSeats(matrix));
        console.log("Totale occupati:", countOccupiedSeats(matrix));
        process.exit(0);
    });
}
run();
