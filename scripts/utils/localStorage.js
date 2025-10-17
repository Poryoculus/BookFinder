/**
 * Local Storage Manager - Centralized storage management with error handling and data validation
 */
export class LocalStorageManager {
  constructor() {
    this.storageKeys = {
      DISCUSSIONS: "bookDiscussions",
      AGENDA: "readingAgenda",
      USER_PREFERENCES: "userPreferences",
      SEARCH_HISTORY: "searchHistory",
      BOOKMARKS: "bookmarks",
    };
  }

  /**
   * Save data to local storage with validation
   * @param {string} key - Storage key
   * @param {*} data - Data to store
   * @returns {boolean} Success status
   */
  setItem(key, data) {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn("Local storage is not available");
        return false;
      }

      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error(`Error saving to local storage (key: ${key}):`, error);
      this.handleStorageError(error, key);
      return false;
    }
  }

  /**
   * Retrieve data from local storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Parsed data or default value
   */
  getItem(key, defaultValue = null) {
    try {
      if (!this.isLocalStorageAvailable()) {
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading from local storage (key: ${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * Remove item from local storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  removeItem(key) {
    try {
      if (!this.isLocalStorageAvailable()) {
        return false;
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from local storage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all app data from local storage
   * @returns {boolean} Success status
   */
  clearAllAppData() {
    try {
      Object.values(this.storageKeys).forEach((key) => {
        this.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error("Error clearing app data:", error);
      return false;
    }
  }

  /**
   * Check if local storage is available
   * @returns {boolean} Availability status
   */
  isLocalStorageAvailable() {
    try {
      const test = "test";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle storage errors gracefully
   * @param {Error} error - Error object
   * @param {string} key - Storage key that caused error
   */
  handleStorageError(error, key) {
    // If storage is full, try to clear some space
    if (error.name === "QuotaExceededError") {
      this.clearOldData();
      console.warn(
        "Storage quota exceeded, cleared old data. Please try again.",
      );
    }
  }

  /**
   * Clear old data to free up space
   */
  clearOldData() {
    // Remove search history first (least critical)
    this.removeItem(this.storageKeys.SEARCH_HISTORY);

    // You could implement more sophisticated cleanup logic here
    console.log("Cleared old data to free up storage space");
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  getStorageUsage() {
    let totalSize = 0;
    const usage = {};

    Object.values(this.storageKeys).forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) {
        const size = new Blob([item]).size;
        usage[key] = {
          size: size,
          sizeKB: (size / 1024).toFixed(2),
        };
        totalSize += size;
      }
    });

    return {
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      usage: usage,
    };
  }

  // Discussion-specific methods
  saveDiscussions(discussions) {
    return this.setItem(this.storageKeys.DISCUSSIONS, discussions);
  }

  loadDiscussions() {
    return this.getItem(this.storageKeys.DISCUSSIONS, new Map());
  }

  // Agenda-specific methods
  saveAgenda(agenda) {
    return this.setItem(this.storageKeys.AGENDA, agenda);
  }

  loadAgenda() {
    return this.getItem(this.storageKeys.AGENDA, {
      readingGoals: [],
      toReadList: [],
      currentlyReading: [],
      finishedBooks: [],
      readingStats: this.getDefaultReadingStats(),
    });
  }

  getDefaultReadingStats() {
    return {
      booksReadThisYear: 0,
      pagesReadThisYear: 0,
      readingStreak: 0,
      averageRating: 0,
      favoriteGenres: [],
      readingTimePerWeek: 0,
      goalsCompleted: 0,
      totalBooksRead: 0,
    };
  }

  // User preferences
  saveUserPreferences(preferences) {
    return this.setItem(this.storageKeys.USER_PREFERENCES, preferences);
  }

  loadUserPreferences() {
    return this.getItem(this.storageKeys.USER_PREFERENCES, {
      userName: "Book Lover",
      theme: "light",
      notifications: true,
      readingGoal: 12,
    });
  }

  // Search history
  saveSearchHistory(searches) {
    // Keep only last 20 searches
    const limitedSearches = searches.slice(-20);
    return this.setItem(this.storageKeys.SEARCH_HISTORY, limitedSearches);
  }

  loadSearchHistory() {
    return this.getItem(this.storageKeys.SEARCH_HISTORY, []);
  }

  // Bookmarks
  saveBookmarks(bookmarks) {
    return this.setItem(this.storageKeys.BOOKMARKS, bookmarks);
  }

  loadBookmarks() {
    return this.getItem(this.storageKeys.BOOKMARKS, []);
  }
}
