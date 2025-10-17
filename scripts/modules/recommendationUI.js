/**
 * Recommendations UI - Handles display and interaction with book recommendations
 */
export class RecommendationUI {
  constructor(recommendationEngine, agendaManager) {
    this.recommendationEngine = recommendationEngine;
    this.agendaManager = agendaManager;
    this.recommendations = [];
  }

  /**
   * Initialize recommendations UI
   */
  init() {
    this.bindEvents();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    document.addEventListener("click", (e) => {
      if (e.target.matches(".refresh-recommendations")) {
        this.handleRefreshRecommendations();
      } else if (e.target.matches(".add-recommendation-to-agenda")) {
        this.handleAddRecommendationToAgenda(e);
      }
    });
  }

  /**
   * Render recommendations section
   */
  async renderRecommendationsSection() {
    const container = document.getElementById("recommendations-section");
    if (!container) return;

    // Show loading state
    container.innerHTML = `
            <div class="recommendations-loading">
                <div class="spinner"></div>
                <p>Finding great books for you...</p>
            </div>
        `;

    try {
      // Generate recommendations
      this.recommendations =
        await this.recommendationEngine.generateRecommendations();
      const weeklyPicks = await this.recommendationEngine.getWeeklyPicks();
      const stats = this.recommendationEngine.getStats();

      // Render recommendations
      container.innerHTML = this.createRecommendationsHTML(
        this.recommendations,
        weeklyPicks,
        stats,
      );

      // Bind events to new elements
      this.bindRecommendationEvents();
    } catch (error) {
      console.error("Error rendering recommendations:", error);
      container.innerHTML = this.createErrorState();
    }
  }

  /**
   * Create recommendations HTML
   * @param {Array} recommendations - Personalized recommendations
   * @param {Array} weeklyPicks - Weekly featured books
   * @param {Object} stats - Recommendation statistics
   * @returns {string} HTML string
   */
  createRecommendationsHTML(recommendations, weeklyPicks, stats) {
    return `
            <div class="recommendations-container fade-in">
                <div class="recommendations-header">
                    <h2 class="section-title">Personalized Recommendations</h2>
                    <div class="recommendations-controls">
                        <button class="refresh-recommendations btn-secondary">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                ${
                  stats.totalRecommendations > 0
                    ? `
                    <div class="recommendations-stats">
                        <span>📊 ${stats.totalRecommendations} recommendations generated</span>
                        <span>•</span>
                        <span>🎯 Based on your reading preferences</span>
                    </div>
                `
                    : ""
                }

                <!-- Weekly Picks -->
                ${
                  weeklyPicks.length > 0
                    ? `
                    <section class="weekly-picks-section">
                        <h3>📅 This Week's Featured Picks</h3>
                        <div class="weekly-picks-grid">
                            ${weeklyPicks.map((book) => this.createRecommendationCard(book, true)).join("")}
                        </div>
                    </section>
                `
                    : ""
                }

                <!-- Personalized Recommendations -->
                <section class="personalized-recommendations">
                    <h3>🎁 Personalized For You</h3>
                    ${
                      recommendations.length > 0
                        ? `
                        <div class="recommendations-grid">
                            ${recommendations.map((book) => this.createRecommendationCard(book, false)).join("")}
                        </div>
                    `
                        : `
                        <div class="no-recommendations">
                            <p>We need more information about your reading preferences to generate personalized recommendations.</p>
                            <p>Start by adding some books to your reading list and marking them as finished!</p>
                        </div>
                    `
                    }
                </section>

                <!-- Recommendation Tips -->
                <div class="recommendation-tips">
                    <h4>💡 Tips for Better Recommendations</h4>
                    <ul>
                        <li>Rate books after you finish reading them</li>
                        <li>Add books from different genres to your reading list</li>
                        <li>Update your reading progress regularly</li>
                        <li>Come back weekly for new recommendations</li>
                    </ul>
                </div>
            </div>
        `;
  }

  /**
   * Create recommendation card HTML
   * @param {Object} book - Book data
   * @param {boolean} isWeeklyPick - Whether it's a weekly pick
   * @returns {string} HTML string
   */
  createRecommendationCard(book, isWeeklyPick = false) {
    const coverUrl =
      book.thumbnail ||
      book.cover ||
      "https://via.placeholder.com/150x200?text=No+Cover";
    const authors = Array.isArray(book.authors)
      ? book.authors.join(", ")
      : "Unknown Author";

    return `
            <div class="recommendation-card ${isWeeklyPick ? "weekly-pick" : ""}" data-book-id="${book.id}">
                ${isWeeklyPick ? '<div class="weekly-badge">Weekly Pick</div>' : ""}
                <div class="recommendation-card-cover">
                    <img src="${coverUrl}" alt="Cover of ${book.title}" loading="lazy">
                </div>
                <div class="recommendation-card-info">
                    <h4 class="recommendation-card-title">${this.escapeHtml(book.title)}</h4>
                    <p class="recommendation-card-author">by ${this.escapeHtml(authors)}</p>
                    
                    ${
                      book.recommendationReason
                        ? `
                        <div class="recommendation-reason">
                            <span class="reason-icon">💡</span>
                            ${book.recommendationReason}
                        </div>
                    `
                        : ""
                    }

                    ${
                      book.description
                        ? `
                        <p class="recommendation-description">${this.truncateText(book.description, 100)}</p>
                    `
                        : ""
                    }

                    <div class="recommendation-actions">
                        <button class="add-recommendation-to-agenda btn-primary" 
                                data-book-id="${book.id}">
                            Add to Reading List
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * Create error state HTML
   * @returns {string} HTML string
   */
  createErrorState() {
    return `
            <div class="recommendations-error">
                <div class="error-icon">😔</div>
                <h3>Unable to Load Recommendations</h3>
                <p>We're having trouble generating recommendations right now. This might be due to:</p>
                <ul>
                    <li>Network connectivity issues</li>
                    <li>API service temporarily unavailable</li>
                    <li>Browser restrictions</li>
                </ul>
                <button class="refresh-recommendations btn-primary">
                    Try Again
                </button>
                <p class="fallback-note">You can still search for books manually using the search feature above.</p>
            </div>
        `;
  }

  /**
   * Bind events to recommendation elements
   */
  bindRecommendationEvents() {
    // Additional event binding for recommendation-specific interactions
    document.querySelectorAll(".recommendation-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".add-recommendation-to-agenda")) {
          this.handleRecommendationClick(card.dataset.bookId);
        }
      });
    });
  }

  /**
   * Handle refresh recommendations
   */
  async handleRefreshRecommendations() {
    await this.renderRecommendationsSection();
    this.showNotification("Recommendations updated!");
  }

  /**
   * Handle adding recommendation to agenda
   * @param {Event} e - Click event
   */
  handleAddRecommendationToAgenda(e) {
    const button = e.target;
    const bookId = button.dataset.bookId;
    const book =
      this.recommendations.find((b) => b.id === bookId) ||
      this.recommendationEngine.getWeeklyPicks().find((b) => b.id === bookId);

    if (book) {
      const addedBook = this.agendaManager.addToReadingList(book);
      button.textContent = "✓ Added!";
      button.disabled = true;
      button.classList.add("added");

      this.showNotification(`"${book.title}" added to your reading list!`);
    }
  }

  /**
   * Handle recommendation card click
   * @param {string} bookId - Book ID
   */
  handleRecommendationClick(bookId) {
    const book = this.recommendations.find((b) => b.id === bookId);
    if (book) {
      // Dispatch event to show book details
      document.dispatchEvent(
        new CustomEvent("bookSelected", {
          detail: {
            bookId: book.id,
            source: book._source || "google",
            bookData: book,
          },
        }),
      );
    }
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   */
  showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification fade-in";
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2F4F4F;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
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
}
