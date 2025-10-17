/**
 * Recommendation Engine - Provides book recommendations
 */
export class RecommendationEngine {
  constructor(agendaManager) {
    this.agendaManager = agendaManager;
    this.recommendations = [];
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations() {
    console.log("🎯 Generating recommendations...");
    try {
      // Get user preferences from reading history
      const preferences = this.analyzeUserPreferences();
      console.log("User preferences:", preferences);

      // Try multiple recommendation strategies
      const strategies = [
        this.getPopularBooks(),
        this.getGenreBasedRecommendations(preferences.favoriteGenres),
        this.getAwardWinners(),
      ];

      const results = await Promise.allSettled(strategies);
      console.log("Strategy results:", results);

      // Combine all recommendations
      let allRecommendations = [];
      const usedIds = new Set();

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          result.value.forEach((book) => {
            if (book.id && !usedIds.has(book.id)) {
              allRecommendations.push(book);
              usedIds.add(book.id);
            }
          });
        }
      });

      console.log("Combined recommendations:", allRecommendations.length);

      // If no recommendations, use fallback
      if (allRecommendations.length === 0) {
        console.log("Using fallback recommendations");
        allRecommendations = this.getFallbackRecommendations();
      }

      this.recommendations = allRecommendations.slice(0, 8); // Limit to 8
      return this.recommendations;
    } catch (error) {
      console.error("❌ Error generating recommendations:", error);
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Analyze user preferences
   */
  analyzeUserPreferences() {
    const agenda = this.agendaManager.exportData();
    const preferences = {
      favoriteGenres: ["Fiction", "Mystery", "Science Fiction"], // Defaults
      favoriteAuthors: [],
    };

    // Analyze finished books for genres
    if (agenda.finishedBooks && agenda.finishedBooks.length > 0) {
      const genreCount = {};
      agenda.finishedBooks.forEach((book) => {
        if (book.categories) {
          book.categories.forEach((genre) => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          });
        }
      });

      preferences.favoriteGenres = Object.entries(genreCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);
    }

    return preferences;
  }

  /**
   * Get popular books from Google Books API
   */
  async getPopularBooks() {
    try {
      console.log("📚 Fetching popular books...");
      const response = await fetch(
        "https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=6&orderBy=relevance",
      );

      if (!response.ok) throw new Error("API response not ok");

      const data = await response.json();
      console.log("Popular books API response:", data);

      return (data.items || []).map((item) => ({
        id: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || ["Unknown Author"],
        description: item.volumeInfo.description || "No description available",
        thumbnail: item.volumeInfo.imageLinks?.thumbnail,
        categories: item.volumeInfo.categories || ["Fiction"],
        recommendationReason: "Popular fiction book",
        relevanceScore: 0.7,
        _source: "google",
      }));
    } catch (error) {
      console.warn("Failed to fetch popular books:", error);
      return [];
    }
  }

  /**
   * Get genre-based recommendations
   */
  async getGenreBasedRecommendations(genres) {
    const recommendations = [];

    for (const genre of genres.slice(0, 2)) {
      try {
        console.log(`📖 Fetching ${genre} books...`);
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(genre)}&maxResults=4`,
        );

        if (response.ok) {
          const data = await response.json();
          const genreBooks = (data.items || []).map((item) => ({
            id: item.id,
            title: item.volumeInfo.title,
            authors: item.volumeInfo.authors || ["Unknown Author"],
            description: item.volumeInfo.description || `A great ${genre} book`,
            thumbnail: item.volumeInfo.imageLinks?.thumbnail,
            categories: item.volumeInfo.categories || [genre],
            recommendationReason: `Because you enjoy ${genre}`,
            relevanceScore: 0.8,
            _source: "google",
          }));
          recommendations.push(...genreBooks);
        }
      } catch (error) {
        console.warn(`Failed to fetch ${genre} books:`, error);
      }
    }

    return recommendations;
  }

  /**
   * Get award-winning books
   */
  async getAwardWinners() {
    try {
      console.log("🏆 Fetching award winners...");
      const response = await fetch(
        "https://www.googleapis.com/books/v1/volumes?q=award+winning&maxResults=4",
      );

      if (response.ok) {
        const data = await response.json();
        return (data.items || []).map((item) => ({
          id: item.id,
          title: item.volumeInfo.title,
          authors: item.volumeInfo.authors || ["Unknown Author"],
          description:
            item.volumeInfo.description || "Award-winning literature",
          thumbnail: item.volumeInfo.imageLinks?.thumbnail,
          categories: item.volumeInfo.categories || ["Fiction"],
          recommendationReason: "Award-winning book",
          relevanceScore: 0.9,
          _source: "google",
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch award winners:", error);
    }
    return [];
  }

  /**
   * Fallback recommendations when APIs fail
   */
  getFallbackRecommendations() {
    console.log("🔄 Using fallback recommendations");
    return [
      {
        id: "fallback-1",
        title: "The Midnight Library",
        authors: ["Matt Haig"],
        description:
          "A novel about a library that contains books that let you experience the lives you could have lived.",
        thumbnail: "https://covers.openlibrary.org/b/id/10598730-M.jpg",
        recommendationReason: "Popular fiction with philosophical themes",
        relevanceScore: 0.9,
      },
      {
        id: "fallback-2",
        title: "Project Hail Mary",
        authors: ["Andy Weir"],
        description:
          "A lone astronaut must save the earth from disaster in this sci-fi thriller.",
        thumbnail: "https://covers.openlibrary.org/b/id/11080272-M.jpg",
        recommendationReason: "Engaging science fiction adventure",
        relevanceScore: 0.9,
      },
      {
        id: "fallback-3",
        title: "Atomic Habits",
        authors: ["James Clear"],
        description: "A guide to building good habits and breaking bad ones.",
        thumbnail: "https://covers.openlibrary.org/b/id/10418849-M.jpg",
        recommendationReason: "Life-changing self-help book",
        relevanceScore: 0.8,
      },
      {
        id: "fallback-4",
        title: "The Vanishing Half",
        authors: ["Brit Bennett"],
        description:
          "The story of twin sisters, their diverging paths, and their daughters.",
        thumbnail: "https://covers.openlibrary.org/b/id/10837363-M.jpg",
        recommendationReason: "Acclaimed literary fiction",
        relevanceScore: 0.8,
      },
    ];
  }

  /**
   * Get weekly picks
   */
  async getWeeklyPicks() {
    try {
      const response = await fetch(
        "https://www.googleapis.com/books/v1/volumes?q=subject:bestseller&maxResults=4",
      );

      if (response.ok) {
        const data = await response.json();
        return (data.items || []).map((item) => ({
          id: item.id,
          title: item.volumeInfo.title,
          authors: item.volumeInfo.authors || ["Unknown Author"],
          description: item.volumeInfo.description || "Current bestseller",
          thumbnail: item.volumeInfo.imageLinks?.thumbnail,
          recommendationReason: "Weekly bestseller pick",
          relevanceScore: 0.9,
          isWeeklyPick: true,
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch weekly picks:", error);
    }
    return [];
  }
}
