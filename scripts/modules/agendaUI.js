/**
 * Agenda UI Manager - Handles rendering and interactions for reading agenda
 */
export class AgendaUI {
  constructor(agendaManager) {
    this.agendaManager = agendaManager;
    this.currentView = "dashboard"; // dashboard, toRead, reading, finished, goals
    this.init();
  }

  /**
   * Initialize agenda UI
   */
  init() {
    this.bindEvents();
    this.renderAgendaDashboard();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Navigation
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-agenda-view]")) {
        this.switchView(e.target.dataset.agendaView);
      } else if (e.target.matches(".add-to-agenda-btn")) {
        this.handleAddToAgenda(e);
      } else if (e.target.matches(".start-reading-btn")) {
        this.handleStartReading(e);
      } else if (e.target.matches(".update-progress-btn")) {
        this.handleUpdateProgress(e);
      } else if (e.target.matches(".finish-reading-btn")) {
        this.handleFinishReading(e);
      } else if (e.target.matches(".remove-from-agenda-btn")) {
        this.handleRemoveFromAgenda(e);
      } else if (e.target.matches(".set-goal-btn")) {
        this.handleSetGoal(e);
      }
    });

    // Progress update form
    document.addEventListener("submit", (e) => {
      if (e.target.matches("#progress-update-form")) {
        e.preventDefault();
        this.handleProgressUpdateSubmit(e);
      } else if (e.target.matches("#goal-setup-form")) {
        e.preventDefault();
        this.handleGoalSetupSubmit(e);
      }
    });
  }

  /**
   * Switch between agenda views
   * @param {string} view - View name
   */
  switchView(view) {
    this.currentView = view;

    // Update active nav button
    document.querySelectorAll("[data-agenda-view]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.agendaView === view);
    });

    switch (view) {
      case "dashboard":
        this.renderAgendaDashboard();
        break;
      case "toRead":
        this.renderToReadList();
        break;
      case "reading":
        this.renderCurrentlyReading();
        break;
      case "finished":
        this.renderFinishedBooks();
        break;
      case "goals":
        this.renderReadingGoals();
        break;
    }
  }

  /**
   * Render agenda dashboard
   */
  renderAgendaDashboard() {
    const container = document.getElementById("agenda-section");
    if (!container) return;

    const summary = this.agendaManager.getAgendaSummary();
    const stats = summary.readingStats;

    container.innerHTML = `
            <div class="agenda-dashboard fade-in">
                <div class="dashboard-header">
                    <h2 class="section-title">My Reading Agenda</h2>
                    <div class="dashboard-actions">
                        <button class="btn-secondary" data-agenda-view="goals">Set Reading Goal</button>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${summary.toReadCount}</div>
                        <div class="stat-label">To Read</div>
                        <button class="stat-action" data-agenda-view="toRead">View List</button>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${summary.currentlyReadingCount}</div>
                        <div class="stat-label">Currently Reading</div>
                        <button class="stat-action" data-agenda-view="reading">View Progress</button>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${summary.finishedCount}</div>
                        <div class="stat-label">Books Read</div>
                        <button class="stat-action" data-agenda-view="finished">View History</button>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.readingStreak}</div>
                        <div class="stat-label">Day Streak</div>
                        <div class="stat-subtitle">Keep going!</div>
                    </div>
                </div>

                <!-- Reading Statistics -->
                <div class="stats-detailed">
                    <h3>Reading Statistics</h3>
                    <div class="stats-list">
                        <div class="stat-item">
                            <span class="stat-name">Books This Year:</span>
                            <span class="stat-number">${stats.booksReadThisYear}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-name">Pages This Year:</span>
                            <span class="stat-number">${stats.pagesReadThisYear}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-name">Average Rating:</span>
                            <span class="stat-number">${stats.averageRating.toFixed(1)}/5</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-name">Weekly Reading:</span>
                            <span class="stat-number">${Math.round(stats.readingTimePerWeek / 60)}h</span>
                        </div>
                    </div>
                </div>

                <!-- Currently Reading Preview -->
                ${this.renderCurrentlyReadingPreview()}

                <!-- Active Goals Preview -->
                ${this.renderGoalsPreview()}

                <!-- Navigation -->
                <div class="agenda-navigation">
                    <button class="nav-btn active" data-agenda-view="dashboard">Dashboard</button>
                    <button class="nav-btn" data-agenda-view="toRead">To Read (${summary.toReadCount})</button>
                    <button class="nav-btn" data-agenda-view="reading">Reading (${summary.currentlyReadingCount})</button>
                    <button class="nav-btn" data-agenda-view="finished">Finished (${summary.finishedCount})</button>
                    <button class="nav-btn" data-agenda-view="goals">Goals (${summary.activeGoals})</button>
                </div>
            </div>
        `;
  }

  /**
   * Render currently reading preview for dashboard
   * @returns {string} HTML string
   */
  renderCurrentlyReadingPreview() {
    const currentlyReading = this.agendaManager.getBooksByStatus("reading");

    if (currentlyReading.length === 0) {
      return `
                <div class="section-preview">
                    <h3>Currently Reading</h3>
                    <div class="empty-state">
                        <p>You're not reading any books right now.</p>
                        <button class="btn-primary" data-agenda-view="toRead">Start Reading</button>
                    </div>
                </div>
            `;
    }

    return `
            <div class="section-preview">
                <h3>Currently Reading</h3>
                <div class="books-preview">
                    ${currentlyReading
                      .slice(0, 3)
                      .map(
                        (book) => `
                        <div class="book-preview-card" data-book-id="${book.id}">
                            <img src="${book.thumbnail || "https://via.placeholder.com/80x120?text=No+Cover"}" 
                                 alt="${book.title}" class="book-preview-cover">
                            <div class="book-preview-info">
                                <h4 class="book-preview-title">${this.escapeHtml(book.title)}</h4>
                                <p class="book-preview-author">by ${this.escapeHtml(book.authors.join(", "))}</p>
                                <div class="reading-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${book.pageCount ? (book.currentPage / book.pageCount) * 100 : 0}%"></div>
                                    </div>
                                    <span class="progress-text">${book.currentPage}/${book.pageCount || "?"} pages</span>
                                </div>
                                <button class="update-progress-btn btn-secondary">Update Progress</button>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                ${
                  currentlyReading.length > 3
                    ? `
                    <div class="preview-footer">
                        <button class="btn-text" data-agenda-view="reading">
                            View all ${currentlyReading.length} books →
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
        `;
  }

  /**
   * Render goals preview for dashboard
   * @returns {string} HTML string
   */
  renderGoalsPreview() {
    const activeGoals = this.agendaManager.getActiveGoals();

    if (activeGoals.length === 0) {
      return `
                <div class="section-preview">
                    <h3>Reading Goals</h3>
                    <div class="empty-state">
                        <p>No active reading goals.</p>
                        <button class="btn-primary" data-agenda-view="goals">Set a Goal</button>
                    </div>
                </div>
            `;
    }

    return `
            <div class="section-preview">
                <h3>Active Goals</h3>
                <div class="goals-preview">
                    ${activeGoals
                      .slice(0, 2)
                      .map(
                        (goal) => `
                        <div class="goal-preview-card">
                            <div class="goal-header">
                                <h4 class="goal-title">${this.escapeHtml(goal.description)}</h4>
                                <span class="goal-deadline">${this.formatDate(goal.endDate)}</span>
                            </div>
                            <div class="goal-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${Math.min(goal.progress, 100)}%"></div>
                                </div>
                                <span class="progress-text">${goal.booksCompleted}/${goal.targetBooks} books</span>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                ${
                  activeGoals.length > 2
                    ? `
                    <div class="preview-footer">
                        <button class="btn-text" data-agenda-view="goals">
                            View all ${activeGoals.length} goals →
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
        `;
  }

  /**
   * Render to-read list
   */
  renderToReadList() {
    const container = document.getElementById("agenda-section");
    const toReadList = this.agendaManager.getBooksByStatus("toRead");

    container.innerHTML = `
            <div class="agenda-list-view fade-in">
                <div class="view-header">
                    <h2 class="section-title">To Read List (${toReadList.length})</h2>
                    <p class="view-subtitle">Books you plan to read</p>
                </div>

                ${toReadList.length === 0 ? this.renderEmptyState("toRead") : ""}

                <div class="books-grid">
                    ${toReadList
                      .map(
                        (book) => `
                        <div class="agenda-book-card" data-book-id="${book.id}">
                            <div class="book-card-header">
                                <img src="${book.thumbnail || "https://via.placeholder.com/100x150?text=No+Cover"}" 
                                     alt="${book.title}" class="book-card-cover">
                                <div class="book-card-actions">
                                    <button class="start-reading-btn btn-primary" title="Start Reading">
                                        📖 Start
                                    </button>
                                    <button class="remove-from-agenda-btn btn-secondary" title="Remove">
                                        ×
                                    </button>
                                </div>
                            </div>
                            <div class="book-card-info">
                                <h3 class="book-card-title">${this.escapeHtml(book.title)}</h3>
                                <p class="book-card-author">by ${this.escapeHtml(book.authors.join(", "))}</p>
                                <div class="book-card-meta">
                                    ${book.pageCount ? `<span class="meta-item">${book.pageCount} pages</span>` : ""}
                                    ${book.publishedDate ? `<span class="meta-item">${book.publishedDate.substring(0, 4)}</span>` : ""}
                                    <span class="meta-item priority-${book.priority}">${book.priority}</span>
                                </div>
                                ${
                                  book.notes
                                    ? `
                                    <div class="book-notes">
                                        <p>${this.escapeHtml(book.notes)}</p>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>

                ${this.renderAgendaNavigation()}
            </div>
        `;
  }

  /**
   * Render currently reading list with progress
   */
  renderCurrentlyReading() {
    const container = document.getElementById("agenda-section");
    const currentlyReading = this.agendaManager.getBooksByStatus("reading");

    container.innerHTML = `
            <div class="agenda-list-view fade-in">
                <div class="view-header">
                    <h2 class="section-title">Currently Reading (${currentlyReading.length})</h2>
                    <p class="view-subtitle">Track your reading progress</p>
                </div>

                ${currentlyReading.length === 0 ? this.renderEmptyState("reading") : ""}

                <div class="reading-progress-list">
                    ${currentlyReading
                      .map(
                        (book) => `
                        <div class="reading-progress-card" data-book-id="${book.id}">
                            <div class="progress-card-header">
                                <img src="${book.thumbnail || "https://via.placeholder.com/80x120?text=No+Cover"}" 
                                     alt="${book.title}" class="progress-book-cover">
                                <div class="progress-card-info">
                                    <h3 class="progress-book-title">${this.escapeHtml(book.title)}</h3>
                                    <p class="progress-book-author">by ${this.escapeHtml(book.authors.join(", "))}</p>
                                    <div class="progress-stats">
                                        <span class="progress-stat">Started: ${this.formatDate(book.startDate)}</span>
                                        <span class="progress-stat">Last read: ${this.formatRelativeTime(book.lastRead)}</span>
                                        <span class="progress-stat">Sessions: ${book.readingSessions.length}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="progress-card-content">
                                <div class="progress-section">
                                    <div class="progress-header">
                                        <span class="progress-label">Reading Progress</span>
                                        <span class="progress-percentage">
                                            ${book.pageCount ? Math.round((book.currentPage / book.pageCount) * 100) : 0}%
                                        </span>
                                    </div>
                                    <div class="progress-bar large">
                                        <div class="progress-fill" style="width: ${book.pageCount ? (book.currentPage / book.pageCount) * 100 : 0}%"></div>
                                    </div>
                                    <div class="progress-details">
                                        <span>Page ${book.currentPage} of ${book.pageCount || "?"}</span>
                                        <span>${book.pageCount ? book.pageCount - book.currentPage : "?"} pages left</span>
                                    </div>
                                </div>

                                <div class="progress-actions">
                                    <button class="update-progress-btn btn-primary">Update Progress</button>
                                    <button class="finish-reading-btn btn-secondary">Finish Book</button>
                                    <button class="remove-from-agenda-btn btn-text">Remove</button>
                                </div>

                                ${
                                  book.notes
                                    ? `
                                    <div class="book-notes">
                                        <strong>Notes:</strong>
                                        <p>${this.escapeHtml(book.notes)}</p>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>

                ${this.renderAgendaNavigation()}
            </div>
        `;
  }

  /**
   * Render empty state for different views
   * @param {string} view - View type
   * @returns {string} HTML string
   */
  renderEmptyState(view) {
    const messages = {
      toRead: {
        title: "No books in your to-read list",
        message:
          "Add books from search results to start building your reading list.",
        action: "Search Books",
      },
      reading: {
        title: "Not currently reading any books",
        message:
          "Start reading a book from your to-read list to track your progress.",
        action: "View To-Read List",
      },
      finished: {
        title: "No books finished yet",
        message:
          "Books you finish reading will appear here with your ratings and reviews.",
        action: "View Reading Progress",
      },
      goals: {
        title: "No reading goals set",
        message: "Set reading goals to stay motivated and track your progress.",
        action: "Set a Goal",
      },
    };

    const config = messages[view] || messages.toRead;

    return `
            <div class="empty-state-agenda">
                <div class="empty-icon">📚</div>
                <h3>${config.title}</h3>
                <p>${config.message}</p>
                <button class="btn-primary" data-agenda-view="${view === "reading" ? "toRead" : view === "finished" ? "reading" : "dashboard"}">
                    ${config.action}
                </button>
            </div>
        `;
  }

  /**
   * Handle add to agenda from search results
   * @param {Event} e - Click event
   */
  handleAddToAgenda(e) {
    const bookCard = e.target.closest(".book-card");
    if (bookCard) {
      const bookData = {
        id: bookCard.dataset.id,
        title: bookCard.querySelector(".book-card-title").textContent,
        authors: [
          bookCard
            .querySelector(".book-card-author")
            .textContent.replace("by ", ""),
        ],
        thumbnail: bookCard.querySelector("img").src,
        // Additional data would come from the actual book data object
      };

      const addedBook = this.agendaManager.addToReadingList(bookData);
      this.showNotification(`"${bookData.title}" added to reading list!`);

      // Update UI if we're on agenda page
      if (this.currentView === "toRead") {
        this.renderToReadList();
      }
    }
  }

  /**
   * Handle start reading action
   * @param {Event} e - Click event
   */
  handleStartReading(e) {
    const bookCard = e.target.closest("[data-book-id]");
    if (bookCard) {
      const bookId = bookCard.dataset.bookId;
      const success = this.agendaManager.startReading(bookId);

      if (success) {
        this.showNotification("Started reading! Track your progress.");
        this.switchView("reading");
      }
    }
  }

  /**
   * Show progress update modal
   * @param {string} bookId - Book ID
   */
  showProgressUpdateModal(bookId) {
    const book = this.agendaManager.findBookById(bookId);
    if (!book) return;

    // Create and show modal for progress update
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Update Reading Progress</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="progress-update-form" data-book-id="${bookId}">
                        <div class="form-group">
                            <label for="pages-read">Pages Read:</label>
                            <input type="number" id="pages-read" name="pagesRead" 
                                   min="1" max="${book.pageCount - book.currentPage}" 
                                   value="10" required>
                            <span class="form-help">Current page: ${book.currentPage}</span>
                        </div>
                        <div class="form-group">
                            <label for="reading-time">Reading Time (minutes):</label>
                            <input type="number" id="reading-time" name="readingTime" 
                                   min="1" value="30">
                        </div>
                        <div class="form-group">
                            <label for="progress-notes">Notes (optional):</label>
                            <textarea id="progress-notes" name="notes" 
                                      placeholder="Any thoughts on this reading session..."></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary close-modal">Cancel</button>
                            <button type="submit" class="btn-primary">Update Progress</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    modal.classList.add("active");

    // Close modal handlers
    modal.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });
  }

  /**
   * Handle progress update form submission
   * @param {Event} e - Submit event
   */
  handleProgressUpdateSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const bookId = form.dataset.bookId;
    const formData = new FormData(form);

    const pagesRead = parseInt(formData.get("pagesRead"));
    const minutesSpent = parseInt(formData.get("readingTime") || 0);
    const notes = formData.get("notes");

    const success = this.agendaManager.addReadingSession(
      bookId,
      pagesRead,
      minutesSpent,
    );

    if (success && notes) {
      this.agendaManager.updateBookNotes(bookId, notes);
    }

    if (success) {
      this.showNotification("Progress updated!");
      form.closest(".modal").remove();
      this.renderCurrentlyReading();
    }
  }

  /**
   * Utility function to escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * Format relative time
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Relative time string
   */
  formatRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return time.toLocaleDateString();
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   */
  showNotification(message) {
    // Simple notification implementation
    const notification = document.createElement("div");
    notification.className = "notification agenda-notification fade-in";
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
      notification.remove();
    }, 3000);
  }
}
