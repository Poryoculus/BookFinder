/**
 * Recommendation Engine - Provides book recommendations based on user preferences and reading history
 */
export class RecommendationEngine {
  constructor(agendaManager) {
    this.agendaManager = agendaManager;
    this.recommendations = [];
    this.genres = [
      "Fiction",
      "Mystery",
      "Science Fiction",
      "Fantasy",
      "Romance",
      "Thriller",
      "Biography",
      "History",
      "Science",
      "Self-Help",
    ];
  }

  /**
   * Generate personalized recommendations
   * @returns {Array} Array of recommended books
   */
  async generateRecommendations() {
    try {
      // Get user's reading history for personalization
      const userPreferences = this.analyzeUserPreferences();

      // Generate recommendations based on preferences
      const recommendations = await this.fetchRecommendations(userPreferences);

      this.recommendations = recommendations;
      return recommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Analyze user's reading preferences from agenda
   * @returns {Object} User preferences object
   */
  analyzeUserPreferences() {
    const agenda = this.agendaManager.exportData();
    const preferences = {
      favoriteGenres: [],
      favoriteAuthors: [],
      averageRating: 0,
      readingLevel: "mixed",
    };

    // Analyze finished books
    if (agenda.finishedBooks && agenda.finishedBooks.length > 0) {
      const genreCount = {};
      const authorCount = {};
      let totalRating = 0;
      let ratedBooks = 0;

      agenda.finishedBooks.forEach((book) => {
        // Count genres
        if (book.categories) {
          book.categories.forEach((genre) => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          });
        }

        // Count authors
        if (book.authors) {
          book.authors.forEach((author) => {
            authorCount[author] = (authorCount[author] || 0) + 1;
          });
        }

        // Calculate average rating
        if (book.rating) {
          totalRating += book.rating;
          ratedBooks++;
        }
      });

      // Get top 3 genres
      preferences.favoriteGenres = Object.entries(genreCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);

      // Get top 3 authors
      preferences.favoriteAuthors = Object.entries(authorCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([author]) => author);

      // Calculate average rating
      if (ratedBooks > 0) {
        preferences.averageRating = totalRating / ratedBooks;
      }
    }

    // If no history, use default preferences
    if (preferences.favoriteGenres.length === 0) {
      preferences.favoriteGenres = ["Fiction", "Mystery", "Science Fiction"];
    }

    return preferences;
  }

  /**
   * Fetch recommendations based on user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} Recommended books
   */
  async fetchRecommendations(preferences) {
    // Combine multiple recommendation strategies
    const strategies = [
      this.getGenreBasedRecommendations(preferences.favoriteGenres),
      this.getPopularBooks(),
      this.getAwardWinners(),
    ];

    const allRecommendations = await Promise.allSettled(strategies);

    // Combine and deduplicate recommendations
    const combined = [];
    const usedBookIds = new Set();

    allRecommendations.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        result.value.forEach((book) => {
          if (!usedBookIds.has(book.id)) {
            combined.push(book);
            usedBookIds.add(book.id);
          }
        });
      }
    });

    // Sort by relevance score
    return combined
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 12); // Return top 12 recommendations
  }

  /**
   * Get recommendations based on favorite genres
   * @param {Array} favoriteGenres - User's favorite genres
   * @returns {Promise<Array>} Genre-based recommendations
   */
  async getGenreBasedRecommendations(favoriteGenres) {
    const recommendations = [];

    for (const genre of favoriteGenres.slice(0, 2)) {
      try {
        // Use OpenLibrary API for genre-based search
        const searchUrl = `https://openlibrary.org/subjects/${genre.toLowerCase().replace(/\s+/g, "_")}.json?limit=6`;
        const response = await fetch(searchUrl);

        if (response.ok) {
          const data = await response.json();
          if (data.works) {
            const genreBooks = data.works.slice(0, 4).map((work) => ({
              id: work.key.replace("/works/", ""),
              title: work.title,
              authors: work.authors
                ? work.authors.map((a) => a.name)
                : ["Unknown Author"],
              firstPublishYear: work.first_publish_year,
              cover: work.cover_id
                ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
                : null,
              subjects: work.subject || [],
              relevanceScore: 0.8, // High score for genre matches
              recommendationReason: `Because you enjoy ${genre} books`,
              _source: "openlibrary",
            }));
            recommendations.push(...genreBooks);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch ${genre} recommendations:`, error);
      }
    }

    return recommendations;
  }

  /**
   * Get currently popular books
   * @returns {Promise<Array>} Popular books
   */
  async getPopularBooks() {
    try {
      // Use Google Books API for popular books
      const searchUrl =
        "https://www.googleapis.com/books/v1/volumes?q=subject:bestseller&maxResults=8&orderBy=relevance";
      const response = await fetch(searchUrl);

      if (response.ok) {
        const data = await response.json();
        return (data.items || []).map((item) => ({
          id: item.id,
          title: item.volumeInfo.title,
          authors: item.volumeInfo.authors || ["Unknown Author"],
          publishedDate: item.volumeInfo.publishedDate,
          description: item.volumeInfo.description,
          thumbnail: item.volumeInfo.imageLinks?.thumbnail,
          averageRating: item.volumeInfo.averageRating,
          ratingsCount: item.volumeInfo.ratingsCount,
          categories: item.volumeInfo.categories || [],
          relevanceScore: 0.6, // Medium score for popular books
          recommendationReason: "Popular bestseller",
          _source: "google",
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch popular books:", error);
    }

    return [];
  }

  /**
   * Get award-winning books
   * @returns {Promise<Array>} Award-winning books
   */
  async getAwardWinners() {
    try {
      // Search for award-winning books
      const awards = ["Pulitzer", "National Book Award", "Booker Prize"];
      const award = awards[Math.floor(Math.random() * awards.length)];

      const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(award)}+award&maxResults=6&orderBy=relevance`;
      const response = await fetch(searchUrl);

      if (response.ok) {
        const data = await response.json();
        return (data.items || []).map((item) => ({
          id: item.id,
          title: item.volumeInfo.title,
          authors: item.volumeInfo.authors || ["Unknown Author"],
          publishedDate: item.volumeInfo.publishedDate,
          description: item.volumeInfo.description,
          thumbnail: item.volumeInfo.imageLinks?.thumbnail,
          averageRating: item.volumeInfo.averageRating,
          ratingsCount: item.volumeInfo.ratingsCount,
          categories: item.volumeInfo.categories || [],
          relevanceScore: 0.7, // High score for award winners
          recommendationReason: `${award} award winner`,
          _source: "google",
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch award winners:", error);
    }

    return [];
  }

  /**
   * Get fallback recommendations when APIs fail
   * @returns {Array} Fallback recommendations
   */
  getFallbackRecommendations() {
    // Curated list of popular and diverse books as fallback
    return [
      {
        id: "fallback-1",
        title: "The Midnight Library",
        authors: ["Matt Haig"],
        description:
          "A novel about a library that contains books that let you experience the lives you could have lived.",
        thumbnail: "https://covers.openlibrary.org/b/id/10598730-M.jpg",
        recommendationReason: "Popular fiction with philosophical themes",
        relevanceScore: 0.5,
      },
      {
        id: "fallback-2",
        title: "Project Hail Mary",
        authors: ["Andy Weir"],
        description:
          "A lone astronaut must save the earth from disaster in this high-stakes sci-fi thriller.",
        thumbnail: "https://covers.openlibrary.org/b/id/11080272-M.jpg",
        recommendationReason: "Engaging science fiction adventure",
        relevanceScore: 0.5,
      },
      {
        id: "fallback-3",
        title: "The Vanishing Half",
        authors: ["Brit Bennett"],
        description:
          "The story of twin sisters, their diverging paths, and their daughters.",
        thumbnail: "https://covers.openlibrary.org/b/id/10837363-M.jpg",
        recommendationReason: "Acclaimed literary fiction",
        relevanceScore: 0.5,
      },
      {
        id: "fallback-4",
        title: "Atomic Habits",
        authors: ["James Clear"],
        description: "A guide to building good habits and breaking bad ones.",
        thumbnail: "https://covers.openlibrary.org/b/id/10418849-M.jpg",
        recommendationReason: "Life-changing self-help book",
        relevanceScore: 0.5,
      },
    ];
  }

  /**
   * Get weekly featured recommendations
   * @returns {Promise<Array>} Weekly featured books
   */
  async getWeeklyPicks() {
    try {
      // Get current week number for variety
      const weekNumber = this.getWeekNumber(new Date());
      const genres = this.genres;
      const currentGenre = genres[weekNumber % genres.length];

      const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(currentGenre)}&maxResults=4&orderBy=newest`;
      const response = await fetch(searchUrl);

      if (response.ok) {
        const data = await response.json();
        return (data.items || []).map((item) => ({
          id: item.id,
          title: item.volumeInfo.title,
          authors: item.volumeInfo.authors || ["Unknown Author"],
          publishedDate: item.volumeInfo.publishedDate,
          description: item.volumeInfo.description,
          thumbnail: item.volumeInfo.imageLinks?.thumbnail,
          categories: item.volumeInfo.categories || [],
          recommendationReason: `Weekly ${currentGenre} pick`,
          relevanceScore: 0.9,
          _source: "google",
          isWeeklyPick: true,
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch weekly picks:", error);
    }

    return [];
  }

  /**
   * Get week number of the year
   * @param {Date} date - Date to get week number for
   * @returns {number} Week number
   */
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get recommendation statistics
   * @returns {Object} Recommendation stats
   */
  getStats() {
    return {
      totalRecommendations: this.recommendations.length,
      lastGenerated: new Date().toISOString(),
      sources: [...new Set(this.recommendations.map((b) => b._source))],
      genres: [
        ...new Set(this.recommendations.flatMap((b) => b.categories || [])),
      ],
    };
  }
}
