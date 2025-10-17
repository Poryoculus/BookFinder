/**
 * Recommendations UI - Simplified version
 */
export class RecommendationUI {
  constructor(recommendationEngine, agendaManager) {
    this.recommendationEngine = recommendationEngine;
    this.agendaManager = agendaManager;
  }

  /**
   * Render recommendations section
   */
  async renderRecommendationsSection() {
    console.log("Rendering recommendations section...");
    const container = document.getElementById("recommendations-section");
    if (!container) {
      console.error("Recommendations section container not found!");
      return;
    }

    // Show loading state
    container.innerHTML = `
            <div class="recommendations-loading">
                <div class="spinner"></div>
                <p>Finding great books for you...</p>
            </div>
        `;

    try {
      // Generate recommendations
      const recommendations =
        await this.recommendationEngine.generateRecommendations();
      const weeklyPicks = await this.recommendationEngine.getWeeklyPicks();

      console.log("Recommendations ready:", recommendations);
      console.log("Weekly picks ready:", weeklyPicks);

      // Render the recommendations
      container.innerHTML = this.createRecommendationsHTML(
        recommendations,
        weeklyPicks,
      );

      // Bind events
      this.bindRecommendationEvents();
    } catch (error) {
      console.error("❌ Error rendering recommendations:", error);
      container.innerHTML = this.createErrorState();
    }
  }

  /**
   * Create recommendations HTML
   */
  createRecommendationsHTML(recommendations, weeklyPicks) {
    return `
            <div class="recommendations-container fade-in">
                <div class="recommendations-header">
                    <h2 class="section-title">📚 Personalized Recommendations</h2>
                    <button class="refresh-recommendations btn-secondary">
                        🔄 Refresh
                    </button>
                </div>

                <!-- Weekly Picks -->
                ${
                  weeklyPicks.length > 0
                    ? `
                    <section class="weekly-picks-section">
                        <h3>⭐ This Week's Featured Picks</h3>
                        <div class="weekly-picks-grid">
                            ${weeklyPicks.map((book) => this.createBookCard(book, true)).join("")}
                        </div>
                    </section>
                `
                    : ""
                }

                <!-- Personalized Recommendations -->
                <section class="personalized-recommendations">
                    <h3>🎯 Recommended For You</h3>
                    ${
                      recommendations.length > 0
                        ? `
                        <div class="recommendations-grid">
                            ${recommendations.map((book) => this.createBookCard(book, false)).join("")}
                        </div>
                    `
                        : `
                        <div class="no-recommendations">
                            <p>Start adding books to your reading list to get personalized recommendations!</p>
                        </div>
                    `
                    }
                </section>
            </div>
        `;
  }

  /**
   * Create book card
   */
  createBookCard(book, isWeeklyPick = false) {
    const coverUrl =
      book.thumbnail || "https://via.placeholder.com/150x200?text=No+Cover";
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
                            💡 ${book.recommendationReason}
                        </div>
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
   * Create error state
   */
  createErrorState() {
    return `
            <div class="recommendations-error">
                <h3>😔 Unable to Load Recommendations</h3>
                <p>Please check your internet connection and try again.</p>
                <button class="refresh-recommendations btn-primary">
                    Try Again
                </button>
            </div>
        `;
  }

  /**
   * Bind events
   */
  bindRecommendationEvents() {
    // Refresh button
    document
      .querySelector(".refresh-recommendations")
      ?.addEventListener("click", () => {
        this.renderRecommendationsSection();
      });

    // Add to agenda buttons
    document
      .querySelectorAll(".add-recommendation-to-agenda")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleAddToAgenda(e.target.dataset.bookId);
        });
      });

    // Card clicks
    document.querySelectorAll(".recommendation-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".add-recommendation-to-agenda")) {
          this.handleBookClick(card.dataset.bookId);
        }
      });
    });
  }

  /**
   * Handle add to agenda
   */
  handleAddToAgenda(bookId) {
    const button = document.querySelector(
      `[data-book-id="${bookId}"] .add-recommendation-to-agenda`,
    );
    if (button) {
      button.textContent = "✓ Added!";
      button.disabled = true;
      this.showNotification("Book added to your reading list!");
    }
  }

  /**
   * Handle book click
   */
  handleBookClick(bookId) {
    console.log("Book clicked:", bookId);
    // You can implement book details view here
  }

  /**
   * Show notification
   */
  showNotification(message) {
    const notification = document.createElement("div");
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
        `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
