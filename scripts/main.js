import { GoogleBooksAPI } from "./api/googleBooks.js";
import { OpenLibraryAPI } from "./api/openLibrary.js";
import { UIManager } from "./modules/uiManager.js";
import { SearchHandler } from "./modules/searchHandler.js";
import { DiscussionManager } from "./modules/discussionManager.js";
import { DiscussionUI } from "./modules/discussionUI.js";
import { AgendaManager } from "./modules/agendaManager.js";
import { AgendaUI } from "./modules/agendaUI.js";
import { RecommendationEngine } from "./modules/recommendationEngine.js";
import { RecommendationUI } from "./modules/recommendationUI.js";

class BookFinderApp {
  constructor() {
    this.apis = {
      googleBooks: new GoogleBooksAPI(),
      openLibrary: new OpenLibraryAPI(),
    };

    // Initialize managers first
    this.modules = {
      ui: new UIManager(),
      search: new SearchHandler(this.apis),
      discussion: new DiscussionManager(),
      agenda: new AgendaManager(),
    };

    // Then initialize UI components that depend on managers
    this.modules.discussionUI = new DiscussionUI(this.modules.discussion);
    this.modules.agendaUI = new AgendaUI(this.modules.agenda);
    this.modules.recommendationEngine = new RecommendationEngine(
      this.modules.agenda,
    );
    this.modules.recommendationUI = new RecommendationUI(
      this.modules.recommendationEngine,
      this.modules.agenda,
    );
    this.currentBookData = null;
    this.init();
  }

  init() {
    this.bindEvents();
    console.log("Book Finder App initialized successfully");
  }

  bindEvents() {
    // Search functionality
    const searchForm = document.getElementById("search-form");
    const searchInput = document.querySelector(".search-input");
    const searchButton = document.querySelector(".search-button");

    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent form submission
        this.handleSearch();
      });
    }

    if (searchButton) {
      searchButton.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent any default behavior
        this.handleSearch();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.handleSearch();
        }
      });
    }

    // Navigation - keep your existing code
    document.querySelectorAll(".nav-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const section = e.target.dataset.section;
        if (section) {
          this.handleNavigation(section);
        }
      });
    });

    // Book selection event - keep your existing code
    document.addEventListener("bookSelected", async (event) => {
      const { bookId, source } = event.detail;
      await this.handleBookSelection(bookId, source);
    });

    // Add to agenda event - keep your existing code
    document.addEventListener("addToAgenda", async (event) => {
      const { bookId, source } = event.detail;
      await this.handleAddToAgenda(bookId, source);
    });
  }

  async handleSearch() {
    const searchInput = document.querySelector(".search-input");
    if (!searchInput) return;

    const query = searchInput.value.trim();
    if (query) {
      await this.modules.search.performSearch(query);
    }
  }

  async handleBookSelection(bookId, source) {
    try {
      this.modules.ui.showLoading();
      const details = await this.modules.search.getEnrichedBookDetails(
        bookId,
        source,
      );
      this.modules.ui.displayBookDetails(details);

      // Store book data for potential discussion creation
      this.currentBookData = details;
    } catch (error) {
      console.error("Error loading book details:", error);
      this.modules.ui.showError(
        "Failed to load book details. Please try again.",
      );
    }
  }

  async handleAddToAgenda(bookId, source) {
    try {
      const details = await this.modules.search.getEnrichedBookDetails(
        bookId,
        source,
      );
      const addedBook = this.modules.agenda.addToReadingList(details);

      // Show success notification
      this.showNotification(`"${details.title}" added to your reading list!`);
    } catch (error) {
      console.error("Error adding book to agenda:", error);
      this.showNotification(
        "Failed to add book to reading list. Please try again.",
      );
    }
  }

  handleNavigation(section) {
    this.modules.ui.showSection(section);

    // Handle section-specific initialization
    switch (section) {
      case "clubs":
        setTimeout(() => {
          if (this.modules.discussionUI) {
            this.modules.discussionUI.renderDiscussionSection();
          }
        }, 100);
        break;
      case "agenda":
        setTimeout(() => {
          if (this.modules.agendaUI) {
            this.modules.agendaUI.renderAgendaDashboard();
          }
        }, 100);
        break;
      case "recommendations":
        setTimeout(() => {
          if (this.modules.recommendationUI) {
            this.modules.recommendationUI.renderRecommendationsSection();
          }
        }, 100);
        break;
    }
  }

  showNotification(message) {
    // Simple notification implementation
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
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new BookFinderApp(); // Store the instance in window.app
  console.log("App instance stored in window.app:", window.app);
});

// Debug function
window.debugApp = function () {
  console.log("=== APP DEBUG ===");
  console.log("App instance:", window.app);

  if (window.app) {
    console.log("✅ App is properly initialized!");
    console.log("Modules:", window.app.modules);
  } else {
    console.log("❌ App is undefined - check initialization");
  }

  console.log("Navigation buttons:", document.querySelectorAll(".nav-button"));
  console.log("Sections:");
  console.log("- Search:", document.getElementById("book-results"));
  console.log("- Discussion:", document.getElementById("discussion-section"));
  console.log("- Agenda:", document.getElementById("agenda-section"));
  console.log(
    "- Recommendations:",
    document.getElementById("recommendations-section"),
  );

  document.querySelectorAll(".nav-button").forEach((btn) => {
    console.log(`Button [${btn.textContent.trim()}]:`, btn.dataset.section);
  });
};

// Remove the duplicate DOMContentLoaded listener
// document.addEventListener("DOMContentLoaded", function () {
//   window.debugApp();
// });
