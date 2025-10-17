// scripts/api/openLibraryAPI.js
export class OpenLibraryAPI {
  constructor() {
    this.baseURL = "https://openlibrary.org";
  }

  async searchBooks(query, limit = 10) {
    try {
      const response = await fetch(
        `${this.baseURL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`,
      );

      if (!response.ok) throw new Error("Open Library API failed");

      const data = await response.json();
      return this.formatBookData(data.docs || []);
    } catch (error) {
      console.error("Open Library search error:", error);
      return [];
    }
  }

  async getBookDetails(bookId) {
    try {
      const response = await fetch(`${this.baseURL}/works/${bookId}.json`);

      if (!response.ok) throw new Error("Open Library API failed");

      const data = await response.json();
      return this.formatBookDetails(data);
    } catch (error) {
      console.error("Open Library details error:", error);
      throw error;
    }
  }

  formatBookData(books) {
    return books.map((book) => ({
      id: book.key.replace("/works/", ""),
      title: book.title,
      authors: book.author_name || ["Unknown Author"],
      firstPublishYear: book.first_publish_year,
      cover: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : null,
      isbn: book.isbn?.[0],
      _source: "openlibrary",
    }));
  }

  formatBookDetails(book) {
    return {
      id: book.key?.replace("/works/", ""),
      title: book.title,
      authors: book.authors?.map((author) => author.author?.key) || [],
      description: book.description?.value || book.description,
      firstPublishYear: book.first_publish_date,
      covers: book.covers
        ? book.covers.map((coverId) => ({
            medium: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
          }))
        : [],
      _source: "openlibrary",
    };
  }
}
