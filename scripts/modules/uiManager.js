/**
 * UI Manager - Handles dynamic UI updates and section management
 */
export class UIManager {
  constructor() {
    this.elements = {
      bookResults: document.getElementById("book-results"),
      bookDetails: document.getElementById("book-details"),
      discussionSection: document.getElementById("discussion-section"),
      agendaSection: document.getElementById("agenda-section"),
      recommendationsSection: document.getElementById(
        "recommendations-section",
      ),
    };
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.elements.bookResults.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Searching for books...</p>
            </div>
        `;
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.elements.bookResults.innerHTML = `
            <div class="error-message fade-in">
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="retry-button btn-primary">Try Again</button>
            </div>
        `;
  }

  /**
   * Display search results
   * @param {Array} books - Array of book objects
   */
  displaySearchResults(books) {
    if (books.length === 0) {
      this.elements.bookResults.innerHTML = `
                <div class="no-results fade-in">
                    <h3>No books found</h3>
                    <p>Try adjusting your search terms or browse by category.</p>
                </div>
            `;
      return;
    }

    const html = `
            <div class="results-header fade-in">
                <h2>Search Results (${books.length} books)</h2>
            </div>
            <div class="books-grid">
                ${books.map((book) => this.createBookCard(book)).join("")}
            </div>
        `;

    this.elements.bookResults.innerHTML = html;
    this.bindBookCardEvents();
  }

  /**
   * Create book card HTML
   * @param {Object} book - Book data
   * @returns {string} HTML string
   */
  createBookCard(book) {
    const coverUrl =
      book.thumbnail ||
      book.cover ||
      "https://via.placeholder.com/150x200?text=No+Cover";
    const authors = Array.isArray(book.authors)
      ? book.authors.join(", ")
      : "Unknown Author";

    return `
            <div class="book-card fade-in" data-id="${book.id}" data-source="${book._source || "google"}">
                <div class="book-card-cover">
                    <img src="${coverUrl}" alt="Cover of ${book.title}" loading="lazy">
                    ${book._source === "openlibrary" ? '<span class="api-badge">OL</span>' : ""}
                </div>
                <div class="book-card-info">
                    <h3 class="book-card-title">${this.truncateText(book.title, 50)}</h3>
                    <p class="book-card-author">by ${this.truncateText(authors, 40)}</p>
                    <button class="add-to-agenda-btn btn-secondary">Add to Reading List</button>
                </div>
            </div>
        `;
  }

  /**
   * Show specific section
   * @param {string} section - Section to show
   */
  showSection(section) {
    // Hide all sections
    Object.values(this.elements).forEach((el) => {
      if (el && el.classList) el.classList.add("hidden");
    });

    // Show selected section
    switch (section) {
      case "clubs":
        if (this.elements.discussionSection)
          this.elements.discussionSection.classList.remove("hidden");
        break;
      case "agenda":
        if (this.elements.agendaSection)
          this.elements.agendaSection.classList.remove("hidden");
        break;
      case "recommendations":
        if (this.elements.recommendationsSection)
          this.elements.recommendationsSection.classList.remove("hidden");
        break;
      default:
        if (this.elements.bookResults)
          this.elements.bookResults.classList.remove("hidden");
    }
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, length) {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  }

  /**
   * Bind events to book cards
   */
  bindBookCardEvents() {
    document.querySelectorAll(".book-card").forEach((card) => {
      card.addEventListener("click", () => {
        const bookId = card.dataset.id;
        const source = card.dataset.source;
        document.dispatchEvent(
          new CustomEvent("bookSelected", {
            detail: { bookId, source },
          }),
        );
      });
    });

    document.querySelectorAll(".add-to-agenda-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const bookCard = e.target.closest(".book-card");
        // This would be handled by the main app
        document.dispatchEvent(
          new CustomEvent("addToAgenda", {
            detail: {
              bookId: bookCard.dataset.id,
              source: bookCard.dataset.source,
            },
          }),
        );
      });
    });
  }
}
