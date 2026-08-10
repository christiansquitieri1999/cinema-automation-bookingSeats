type Matrix = number[][];
type UserSeatPosition = { row: number; col: number };
type AdjacentFreePair = { first: UserSeatPosition; second: UserSeatPosition };
type BookingResult = "booked" | "already-booked" | "out-of-range";
type BookingCheckResult = { success: boolean; message: string };

/**
 * Crea la sala con valori binari:
 * 0 = libero, 1 = occupato.
 */
function createMatrix(rows: number = 8, cols: number = 10): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

/**
 * Restituisce il numero totale di posti liberi.
 */
function countFreeSeats(matrix: Matrix): number {
  return matrix.flat().filter((cell) => cell === 0).length;
}

/**
 * Restituisce il numero totale di posti occupati.
 */
function countOccupiedSeats(matrix: Matrix): number {
  return matrix.flat().filter((cell) => cell === 1).length;
}

/**
 * Prova a prenotare un posto usando coordinate interne 0-based.
 * Non lancia eccezioni: restituisce uno stato esplicito.
 */
function bookSeatAtPosition(matrix: Matrix, row: number, col: number): BookingResult {
  const inRange = row >= 0 && row < matrix.length && col >= 0 && col < matrix[0].length;
  if (!inRange) return "out-of-range";
  if (matrix[row][col] === 1) return "already-booked";
  matrix[row][col] = 1;
  return "booked";
}

/**
 * Cerca la prima coppia orizzontale di posti liberi.
 * Le coordinate restituite sono 1-based (formato utente).
 */
function findFirstAdjacentFreePair(matrix: Matrix): AdjacentFreePair | null {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length - 1; col++) {
      if (matrix[row][col] === 0 && matrix[row][col + 1] === 0) {
        return {
          first: { row: row + 1, col: col + 1 },
          second: { row: row + 1, col: col + 2 },
        };
      }
    }
  }
  return null;
}

/**
 * Valida il tentativo di prenotazione e produce un messaggio pronto per la UI CLI.
 */
function checkSeatBooking(matrix: Matrix, row: number, col: number): BookingCheckResult {
  const result = bookSeatAtPosition(matrix, row, col);
  if (result === "booked") return { success: true, message: "Your booking is confirmed" };
  if (result === "already-booked") {
    return { success: false, message: "the seat is already booked, choose other seat" };
  }
  return { success: false, message: "Seat out of range, choose other seat." };
}

/**
 * Trasforma un input stringa nel formato `(r,c)` in coordinate 0-based.
 * Restituisce `null` se il formato non e' valido o se i valori non sono >= 1.
 */
function parseUserSeatInput(input: string): { row: number; col: number } | null {
  const match = input.trim().match(/^\(\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (!match) return null;

  const [userRow, userCol] = [Number(match[1]), Number(match[2])];
  if (!Number.isInteger(userRow) || !Number.isInteger(userCol) || userRow < 1 || userCol < 1) {
    return null;
  }

  return { row: userRow - 1, col: userCol - 1 };
}

/**
 * Gestisce la domanda di conferma in loop finche' l'utente non risponde `yes` o `no`.
 */
async function askYesNo(
  askQuestion: (question: string) => Promise<string>,
  question: string,
): Promise<boolean> {
  while (true) {
    const answer = (await askQuestion(question)).trim().toLowerCase();
    if (answer === "yes") return true;
    if (answer === "no") return false;
    console.log('Invalid answer. Please type "yes" or "no".');
  }
}

/**
 * Crea un reader a righe su stdin, adatto sia a input interattivo sia a input pipe.
 */
function createQuestionAsker(runtimeProcess: any): (question: string) => Promise<string> {
  let buffer = "";
  const queue: string[] = [];
  const waiters: Array<(line: string) => void> = [];

  runtimeProcess.stdin.setEncoding("utf8");
  runtimeProcess.stdin.on("data", (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const waiter = waiters.shift();
      if (waiter) waiter(line);
      else queue.push(line);
    }
  });

  return (question: string): Promise<string> =>
    new Promise((resolve) => {
      runtimeProcess.stdout.write(question);
      const queued = queue.shift();
      if (queued !== undefined) {
        resolve(queued.trim());
        return;
      }
      waiters.push((line: string) => resolve(line.trim()));
    });
}

/**
 * Mostra lo stato corrente della prima coppia adiacente libera.
 */
function printAdjacentPairStatus(matrix: Matrix): void {
  const pair = findFirstAdjacentFreePair(matrix);
  if (!pair) {
    console.log("No adjacent free seats available.");
    return;
  }
  console.log(
    `Adjacent free seats: (${pair.first.row},${pair.first.col}) and (${pair.second.row},${pair.second.col})`,
  );
}

/**
 * Flusso principale CLI:
 * mostra lo stato iniziale, gestisce prenotazioni ripetute e stampa riepilogo finale.
 */
async function run(): Promise<void> {
  const runtimeProcess = (globalThis as { process?: any }).process;
  if (!runtimeProcess) throw new Error("Node.js process is not available.");

  const askQuestion = createQuestionAsker(runtimeProcess);
  const matrix = createMatrix();

  console.log("Initial matrix:");
  console.table(matrix);
  console.log("Total available seats:", countFreeSeats(matrix));
  console.log("Total occupied seats:", countOccupiedSeats(matrix));
  printAdjacentPairStatus(matrix);

  while (true) {
    const parsed = parseUserSeatInput(
      await askQuestion("Choose your seat (row,col), example (2,1): "),
    );
    if (!parsed) {
      console.log("Invalid format. Use (row,col) with 1-based values.");
      continue;
    }

    const bookingCheck = checkSeatBooking(matrix, parsed.row, parsed.col);
    console.log(bookingCheck.message);
    if (!bookingCheck.success) continue;

    printAdjacentPairStatus(matrix);
    const needAnotherSeat = await askYesNo(askQuestion, "do you need another seat? (yes/no): ");
    if (!needAnotherSeat) break;
  }

  console.log("Updated matrix:");
  console.table(matrix);
  console.log("Total available seats:", countFreeSeats(matrix));
  console.log("Total occupied seats:", countOccupiedSeats(matrix));
}

run().catch((error: unknown) => {
  console.error("Unexpected error:", error);
  const runtimeProcess = (globalThis as { process?: any }).process;
  if (runtimeProcess) runtimeProcess.exit(1);
});
