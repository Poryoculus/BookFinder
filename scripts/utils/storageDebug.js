import { GoogleBooksAPI } from "./scripts/api/googleBooks.js";
import { OpenLibraryAPI } from "./scripts/api/openLibrary.js";
import { UIManager } from "./scripts/modules/uiManager.js";
import { SearchHandler } from "./scripts/modules/searchHandler.js";
import { DiscussionManager } from "./scripts/modules/discussionManager.js";
import { DiscussionUI } from "./scripts/modules/discussionUI.js";
import { AgendaManager } from "./scripts/modules/agendaManager.js";
import { AgendaUI } from "./scripts/modules/agendaUI.js";
import { LocalStorageManager } from "./scripts/utils/localStorage.js";

class BookFinderApp {
  constructor() {
    this.storage = new LocalStorageManager();

    // APIs
    this.apis = {
      googleBooks: new GoogleBooksAPI(),
      openLibrary: new OpenLibraryAPI(),
    };

    // Modules
    this.modules = {
      ui: new UIManager(),
      search: new SearchHandler(this.apis),
      discussion: new DiscussionManager(),
      discussionUI: null,
      agenda: new AgendaManager(),
      agendaUI: null,
    };

    // Current selected book
    this.currentBookData = null;

    // Initialize
    this.init();
  }

  async init() {
    try {
      if (!this.storage.isLocalStorageAvailable()) {
        this.showStorageWarning();
      }

      // Initialize dependent UIs
      this.modules.discussionUI = new DiscussionUI(this.modules.discussion);
      this.modules.agendaUI = new AgendaUI(this.modules.agenda);

      this.bindEvents();
      this.loadUserPreferences();

      console.log("Book Finder App initialized successfully");
      console.log("Storage usage:", this.storage.getStorageUsage());
    } catch (error) {
      console.error("Error initializing app:", error);
      this.showError(
        "Failed to initialize application. Please refresh the page.",
      );
    }
  }

  bindEvents() {
    // Search functionality
    const searchInput = document.querySelector(".search-input");
    const searchButton = document.querySelector(".search-button");

    searchButton.addEventListener("click", () => this.handleSearch());
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleSearch();
    });

    // Navigation
    document.querySelectorAll(".nav-button").forEach((button) => {
      button.addEventListener("click", (e) =>
        this.handleNavigation(e.target.dataset.section),
      );
    });

    // Book selection
    document.addEventListener(
      "bookSelected",
      this.handleBookSelectedEvent.bind(this),
    );
  }

  async handleSearch() {
    const query = document.querySelector(".search-input").value.trim();
    if (query) {
      await this.modules.search.performSearch(query);
    }
  }

  async handleBookSelectedEvent(event) {
    const { bookId, source, bookData } = event.detail;
    await this.handleBookSelection(bookId, source, bookData);
  }

  async handleBookSelection(bookId, source, bookData = null) {
    try {
      this.modules.ui.showLoading();
      const details = await this.modules.search.getEnrichedBookDetails(
        bookId,
        source,
      );
      this.modules.ui.displayBookDetails(details);

      // Store for discussions
      this.currentBookData = details;
    } catch (error) {
      console.error("Error loading book details:", error);
      this.modules.ui.showError(
        "Failed to load book details. Please try again.",
      );
    }
  }

  handleNavigation(section) {
    this.modules.ui.showSection(section);

    if (section === "agenda") {
      requestAnimationFrame(() =>
        this.modules.agendaUI.renderAgendaDashboard(),
      );
    } else if (section === "clubs") {
      requestAnimationFrame(() =>
        this.modules.discussionUI.renderDiscussionSection(),
      );
    }
  }

  loadUserPreferences() {
    const prefs = this.storage.loadUserPreferences();
    if (prefs.theme === "dark") document.body.classList.add("dark-theme");
    console.log("User preferences loaded:", prefs);
  }

  showStorageWarning() {
    const warning = document.createElement("div");
    warning.className = "storage-warning";
    warning.innerHTML = `
            <div class="warning-content">
                <h3>Limited Functionality</h3>
                <p>Your browser does not support local storage or it is disabled. 
                   Some features like saving your reading list and discussions will not work properly.</p>
                <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
            </div>
        `;
    warning.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #ff6b6b;
            color: white; padding: 15px; border-radius: 8px; z-index: 10000;
          max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
    document.body.appendChild(warning);
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message-global";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: #dc3545; color: white; padding: 12px 20px; border-radius: 4px;
            z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  new BookFinderApp();
});

// For debugging
window.BookFinderApp = BookFinderApp;
