// This file is a part of error handling during scraping.

// Thrown by an agency module when a page loads but does not look the way we expect (missing result counter, fewer links than the site says it has, ...).
// This is the "F2" failure: a layout change or a block that needs a human to fix.
// Note: Plain network errors (timeouts, bad status) are NOT this error, they are "F1".
export class ScrapeLayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScrapeLayoutError";
  }
}
