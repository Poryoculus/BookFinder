export class UIManager {
  constructor() {
    this.elements = {
      bookResults: document.getElementById("book-results"),
      bookDetails: document.getElementById("book-details"),
      discussionSection: document.getElementById("discussion-section"),
      agendaSection: document.getElementById("agenda-section"),
    };
  }

  /**
   * Display search results with enriched data
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
   * Create HTML for a book card
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
    const rating = book.averageRating || book.ratings?.average || 0;

    return `
            <div class="book-card fade-in" data-id="${book.id}" data-source="${book._source || "google"}">
                <div class="book-card-cover">
                    <img src="${coverUrl}" alt="Cover of ${book.title}" loading="lazy">
                    ${book._source === "openlibrary" ? '<span class="api-badge">OL</span>' : ""}
                </div>
                <div class="book-card-info">
                    <h3 class="book-card-title">${this.truncateText(book.title, 50)}</h3>
                    <p class="book-card-author">by ${this.truncateText(authors, 40)}</p>
                    ${
                      rating
                        ? `
                        <div class="book-card-rating">
                            <span class="stars">${this.generateStars(rating)}</span>
                            <span class="rating-text">${rating.toFixed(1)}</span>
                        </div>
                    `
                        : ""
                    }
                    ${
                      book.firstPublishYear
                        ? `
                        <p class="book-card-year">First published: ${book.firstPublishYear}</p>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  }

  /**
   * Display enriched book details
   * @param {Object} book - Enriched book data
   */
  displayBookDetails(book) {
    const html = `
            <div class="book-details-content fade-in">
                <div class="book-cover-large">
                    <img src="${book.thumbnail || book.covers?.[0]?.medium || "https://via.placeholder.com/300x450?text=No+Cover"}" 
                         alt="Cover of ${book.title}">
                </div>
                <div class="book-info-detailed">
                    <h2 class="book-title">${book.title}</h2>
                    <p class="book-author">by ${book.authors.join(", ")}</p>
                    
                    ${
                      book.averageRating
                        ? `
                        <div class="book-rating-detailed">
                            <div class="stars">${this.generateStars(book.averageRating)}</div>
                            <div class="rating-text">${book.averageRating.toFixed(1)}/5 (${book.ratingsCount || 0} ratings)</div>
                        </div>
                    `
                        : ""
                    }

                    <div class="book-meta">
                        ${book.publishedDate ? `<p><strong>Published:</strong> ${book.publishedDate}</p>` : ""}
                        ${book.pageCount ? `<p><strong>Pages:</strong> ${book.pageCount}</p>` : ""}
                        ${
                          book.categories?.length
                            ? `
                            <div class="book-tags">
                                ${book.categories.map((cat) => `<span class="tag">${cat}</span>`).join("")}
                            </div>
                        `
                            : ""
                        }
                    </div>

                    ${
                      book.description
                        ? `
                        <div class="summary-section">
                            <h3 class="section-title">Summary</h3>
                            <div class="summary-text">${book.description}</div>
                        </div>
                    `
                        : ""
                    }

                    <!-- Author Information from Open Library -->
                    ${book.openLibrary?.authors ? this.createAuthorSection(book.openLibrary.authors) : ""}

                    <!-- Additional Open Library Data -->
                    ${
                      book.openLibrary?.subjects?.length
                        ? `
                        <div class="additional-info">
                            <h4>Subjects & Themes</h4>
                            <div class="subject-tags">
                                ${book.openLibrary.subjects
                                  .slice(0, 8)
                                  .map(
                                    (subject) =>
                                      `<span class="subject-tag">${subject}</span>`,
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;

    this.elements.bookDetails.innerHTML = html;
    this.elements.bookDetails.classList.remove("hidden");
  }

  /**
   * Create author information section
   * @param {Array} authors - Array of author objects
   * @returns {string} HTML string
   */
  createAuthorSection(authors) {
    return `
            <div class="authors-section">
                <h3 class="section-title">About the Author${authors.length > 1 ? "s" : ""}</h3>
                ${authors
                  .map(
                    (author) => `
                    <div class="author-info">
                        <h4>${author.name}</h4>
                        <p class="author-bio">${this.truncateText(author.bio, 300)}</p>
                        ${author.birthDate ? `<p><strong>Born:</strong> ${author.birthDate}</p>` : ""}
                    </div>
                `,
                  )
                  .join("")}
            </div>
        `;
  }

  /**
   * Generate star rating HTML
   * @param {number} rating - Rating from 0 to 5
   * @returns {string} Star HTML
   */
  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars)
    );
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

  showLoading() {
    this.elements.bookResults.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Searching for books...</p>
            </div>
        `;
  }

  showError(message) {
    this.elements.bookResults.innerHTML = `
            <div class="error-message fade-in">
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="retry-button">Try Again</button>
            </div>
        `;
  }

  bindBookCardEvents() {
    document.querySelectorAll(".book-card").forEach((card) => {
      card.addEventListener("click", () => {
        const bookId = card.dataset.id;
        const source = card.dataset.source;
        // This will be handled by the main controller
        document.dispatchEvent(
          new CustomEvent("bookSelected", {
            detail: { bookId, source },
          }),
        );
      });
    });
  }

  showSection(section) {
    // Hide all sections
    Object.values(this.elements).forEach((el) => {
      if (el) el.classList.add("hidden");
    });

    // Show selected section
    if (section === "clubs" && this.elements.discussionSection) {
      this.elements.discussionSection.classList.remove("hidden");
    } else if (section === "agenda" && this.elements.agendaSection) {
      this.elements.agendaSection.classList.remove("hidden");
    } else {
      this.elements.bookResults.classList.remove("hidden");
    }
  }
}
