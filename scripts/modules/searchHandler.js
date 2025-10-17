import { UIManager } from "./uiManager.js";

/**
 * Search Handler - Manages book search functionality
 */
export class SearchHandler {
  constructor(apis) {
    this.apis = apis;
    this.ui = new UIManager();
    this.currentResults = [];
  }

  /**
   * Perform search across both APIs
   * @param {string} query - Search query
   */
  async performSearch(query) {
    try {
      this.ui.showLoading();

      const [googleResults, openLibraryResults] = await Promise.allSettled([
        this.apis.googleBooks.searchBooks(query),
        this.apis.openLibrary.searchBooks(query),
      ]);

      const results = this.mergeResults(
        googleResults.status === "fulfilled" ? googleResults.value : [],
        openLibraryResults.status === "fulfilled"
          ? openLibraryResults.value
          : [],
      );

      this.currentResults = results;
      this.ui.displaySearchResults(results);
    } catch (error) {
      console.error("Search Error:", error);
      this.ui.showError("Failed to search books. Please try again.");
    }
  }

  /**
   * Merge results from both APIs
   */
  mergeResults(googleResults, openLibraryResults) {
    const merged = [...googleResults];
    const usedTitles = new Set(
      googleResults.map((book) => book.title.toLowerCase()),
    );

    openLibraryResults.forEach((book) => {
      if (!usedTitles.has(book.title.toLowerCase())) {
        merged.push(book);
        usedTitles.add(book.title.toLowerCase());
      }
    });

    return merged.slice(0, 20);
  }

  /**
   * Get enriched book details
   */
  async getEnrichedBookDetails(bookId, source) {
    try {
      let details;

      if (source === "google") {
        details = await this.apis.googleBooks.getBookDetails(bookId);
      } else {
        details = await this.apis.openLibrary.getBookDetails(bookId);
      }

      return details;
    } catch (error) {
      console.error("Error fetching book details:", error);
      throw new Error("Failed to load book details");
    }
  }
}
