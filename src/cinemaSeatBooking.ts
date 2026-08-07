type Matrix = number[][];

// 0 = libero, 1 = occupato
function createMatrix(rows: number = 8, cols: number = 10): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function countFreeSeats(matrix: Matrix): number {
  return matrix.flat().filter((cell) => cell === 0).length;
}

function countOccupiedSeats(matrix: Matrix): number {
  return matrix.flat().filter((cell) => cell === 1).length;
}

function bookFirstAvailableSeat(matrix: Matrix): string {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] === 0) {
        matrix[row][col] = 1;
        return `(${row}.${col})`;
      }
    }
  }
  return "nessuna";
}

function run(): void {
  const matrix = createMatrix();

  console.log("Matrice iniziale:");
  console.table(matrix);
  console.log("Totale liberi:", countFreeSeats(matrix));
  console.log("Totale occupati:", countOccupiedSeats(matrix));

  process.stdout.write("Vuoi prenotare il primo posto libero? (si/no): ");
  process.stdin.setEncoding("utf8");

  process.stdin.once("data", (raw: string) => {
    const input = raw.trim().toLowerCase();

    if (input === "si" || input === "s") {
      const bookedPosition = bookFirstAvailableSeat(matrix);
      if (bookedPosition === "nessuna") {
        console.log("Nessun posto disponibile");
      } else {
        console.log(`Posto prenotato in posizione ${bookedPosition}`);
      }
    } else if (input === "no" || input === "n") {
      console.log("Prenotazione annullata");
    } else {
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
