export class GoogleBooksAPI {
  constructor() {
    this.baseURL = "https://www.googleapis.com/books/v1/volumes";
  }

  async searchBooks(query, maxResults = 12) {
    try {
      const response = await fetch(
        `${this.baseURL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books`,
      );

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      return this.formatBookData(data.items || []);
    } catch (error) {
      console.error("Google Books API Error:", error);
      throw new Error("Failed to search books");
    }
  }

  async getBookDetails(bookId) {
    try {
      const response = await fetch(`${this.baseURL}/${bookId}`);

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      return this.formatBookDetails(data);
    } catch (error) {
      console.error("Google Books API Error:", error);
      throw new Error("Failed to fetch book details");
    }
  }

  formatBookData(books) {
    return books.map((book) => ({
      id: book.id,
      title: book.volumeInfo.title,
      authors: book.volumeInfo.authors || ["Unknown Author"],
      publishedDate: book.volumeInfo.publishedDate,
      description: book.volumeInfo.description,
      thumbnail: book.volumeInfo.imageLinks?.thumbnail,
      averageRating: book.volumeInfo.averageRating,
      ratingsCount: book.volumeInfo.ratingsCount,
      categories: book.volumeInfo.categories || [],
      pageCount: book.volumeInfo.pageCount,
      previewLink: book.volumeInfo.previewLink,
    }));
  }

  formatBookDetails(book) {
    return {
      id: book.id,
      title: book.volumeInfo.title,
      authors: book.volumeInfo.authors || ["Unknown Author"],
      publishedDate: book.volumeInfo.publishedDate,
      description: book.volumeInfo.description,
      thumbnail: book.volumeInfo.imageLinks?.thumbnail,
      averageRating: book.volumeInfo.averageRating,
      ratingsCount: book.volumeInfo.ratingsCount,
      categories: book.volumeInfo.categories || [],
      pageCount: book.volumeInfo.pageCount,
      previewLink: book.volumeInfo.previewLink,
      industryIdentifiers: book.volumeInfo.industryIdentifiers,
    };
  }
}

// ADD THIS LINE - Export an instance for the import to work
export const googlebooksapi = new GoogleBooksAPI();
