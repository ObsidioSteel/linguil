// Import Node.js filesystem module, a CSV parser, and Firebase logger.
import * as fs from "fs";
import * as Papa from "papaparse";
import * as logger from "firebase-functions/logger";

// Define a type for a row in a CSV file, which is an object with string keys and values.
export type CsvRow = { [key: string]: string };

// Configuration object for the Papa Parse CSV parser.
const papaParseConfig = {
  header: true, // Treat the first row as headers.
  skipEmptyLines: true, // Ignore empty lines in the CSV file.
  transformHeader: (h: string) => h.trim(), // Trim whitespace from header names.
};

// Parses an entire CSV file from a given file path and returns it as an array of objects.
export function parseCsvFile(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const data: CsvRow[] = [];
    fs.createReadStream(filePath, "utf8") // Create a readable stream from the file.
      .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, papaParseConfig)) // Pipe the stream into the CSV parser.
      .on("data", (chunk) => data.push(chunk)) // Accumulate parsed data chunks.
      .on("end", () => resolve(data)) // Resolve the promise with the full data on completion.
      .on("error", (error) => reject(error)); // Reject the promise if an error occurs.
  });
}

// Finds the first row in a CSV file that satisfies a given predicate function, streaming the file for efficiency.
export function findRowInCsv(filePath: string, predicate: (row: CsvRow) => boolean): Promise<CsvRow | null> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, "utf8")
      .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, papaParseConfig))
      .on("data", (row: CsvRow) => {
        // If the predicate returns true for the current row, destroy the stream and resolve.
        if (predicate(row)) {
          stream.destroy();
          resolve(row);
        }
      });

    stream.on("end", () => resolve(null)); // If the end of the stream is reached without finding a match, resolve with null.
    stream.on("error", (error) => { // Handle any stream or parsing errors.
      logger.error(`Failed to read or parse CSV file at: ${filePath}`, { error });
      reject(error);
    });
  });
}

// Parses a word string that may contain a native script and a transliteration in parentheses.
export function parseWord(wordString: string): { nativeScript: string; transliteration: string } {
  // Return empty strings if the input is falsy.
  if (!wordString) {
    return { nativeScript: "", transliteration: "" };
  }
  // Use regex to find content inside and outside parentheses.
  const match = wordString.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (match && match[1] && match[2]) {
    // If a match is found, return the trimmed native script and transliteration.
    return { nativeScript: match[1].trim(), transliteration: match[2].trim() };
  }
  // If no parentheses are found, assume the whole string is both the native script and transliteration.
  const trimmedWord = wordString.trim();
  return { nativeScript: trimmedWord, transliteration: trimmedWord };
}

// Generates a deterministic pseudo-random number between 0 and 1 based on a given seed.
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Shuffles an array in a deterministic way using a given seed.
export function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]; // Create a shallow copy of the array.
  // Use the Fisher-Yates shuffle algorithm with the seeded random number generator.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Selects a random item from an array in a deterministic way using a given seed.
export function getRandomItem<T>(data: T[], seed: number): T | undefined {
  if (!data || data.length === 0) return undefined;
  const randomIndex = Math.floor(seededRandom(seed) * data.length);
  return data[randomIndex];
}