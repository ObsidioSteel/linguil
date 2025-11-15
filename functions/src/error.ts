// Defines a custom error class for CSV parsing errors.
export class CsvParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvParsingError";
  }
}

// Defines a custom error class for data validation errors.
export class DataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataValidationError";
  }
}

// Defines a custom error class for Text-to-Speech (TTS) errors.
export class TtsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TtsError";
  }
}