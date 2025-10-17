mport { LocalStorageManager } from '../utils/localStorage.js';

/**
 * Agenda Manager - Handles reading goals, to-read lists, and reading progress
 */
export class AgendaManager {
    constructor() {
        this.storage = typeof LocalStorageManager !== "undefined" ? new LocalStorageManager() : null;
        this.agenda = this.getDefaultAgenda();
        this.loadFromStorage();
    }

    /**
     * Default agenda structure
     */
    getDefaultAgenda() {
        return {
            readingGoals: [],
            toReadList: [],
            currentlyReading: [],
            finishedBooks: [],
            readingStats: this.getDefaultStats(),
            lastUpdated: new Date().toISOString(),
        };
    }

    /**
     * Default reading stats
     */
    getDefaultStats() {
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

    /**
     * Load agenda from storage
     */
    loadFromStorage() {
        try {
            let stored;
            if (this.storage) {
                stored = this.storage.loadAgenda();
            } else {
                stored = localStorage.getItem("readingAgenda");
                stored = stored ? JSON.parse(stored) : null;
            }

            if (stored) {
                this.agenda = {
                    ...this.getDefaultAgenda(),
                    ...stored,
                    readingGoals: Array.isArray(stored.readingGoals) ? stored.readingGoals : [],
                    toReadList: Array.isArray(stored.toReadList) ? stored.toReadList : [],
                    currentlyReading: Array.isArray(stored.currentlyReading) ? stored.currentlyReading : [],
                    finishedBooks: Array.isArray(stored.finishedBooks) ? stored.finishedBooks : [],
                    readingStats: { ...this.getDefaultStats(), ...(stored.readingStats || {}) },
                };

                // Ensure reading sessions arrays exist
                this.agenda.currentlyReading.forEach(book => {
                    if (!Array.isArray(book.readingSessions)) book.readingSessions = [];
                });
            }

            console.log("Agenda loaded successfully");
        } catch (error) {
            console.error("Error loading agenda from storage:", error);
            this.agenda = this.getDefaultAgenda();
            this.saveToStorage();
        }
    }

    /**
     * Save agenda to storage
     */
    saveToStorage() {
        try {
            this.agenda.lastUpdated = new Date().toISOString();
            if (this.storage) {
                this.storage.saveAgenda(this.agenda);
            } else {
                localStorage.setItem("readingAgenda", JSON.stringify(this.agenda));
            }
        } catch (error) {
            console.error("Error saving agenda:", error);
        }
    }

    /**
     * Add a book to to-read list with duplicate prevention
     */
    addToReadingList(bookData, priority = "medium") {
        if (!bookData || !bookData.id || !bookData.title) throw new Error("Invalid book data");

        const existingIndex = this.agenda.toReadList.findIndex(
            item => item.bookId === bookData.id && !item.isRead
        );

        const bookItem = {
            id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            bookId: bookData.id,
            title: bookData.title,
            authors: bookData.authors || ["Unknown Author"],
            thumbnail: bookData.thumbnail,
            pageCount: bookData.pageCount || 0,
            publishedDate: bookData.publishedDate,
            categories: bookData.categories || [],
            priority,
            dateAdded: new Date().toISOString(),
            notes: "",
            plannedReadDate: null,
            isRead: false,
        };

        if (existingIndex === -1) {
            this.agenda.toReadList.push(bookItem);
            this.saveToStorage();
            return bookItem;
        } else {
            this.agenda.toReadList[existingIndex] = { ...this.agenda.toReadList[existingIndex], ...bookItem, id: this.agenda.toReadList[existingIndex].id };
            this.saveToStorage();
            return this.agenda.toReadList[existingIndex];
        }
    }

    /**
     * Start reading a book (move from to-read to currentlyReading)
     */
    startReading(bookItemId, currentPage = 0) {
        const bookIndex = this.agenda.toReadList.findIndex(item => item.id === bookItemId);
        if (bookIndex === -1) return false;

        const book = this.agenda.toReadList.splice(bookIndex, 1)[0];
        const currentlyReadingItem = { ...book, startDate: new Date().toISOString(), currentPage, readingSessions: [], lastRead: new Date().toISOString() };
        this.agenda.currentlyReading.push(currentlyReadingItem);
        this.saveToStorage();
        return true;
    }

    /**
     * Add reading session
     */
    addReadingSession(bookItemId, pagesRead, minutesSpent = 0) {
        const book = this.findBookById(bookItemId);
        if (!book || !this.agenda.currentlyReading.includes(book)) return false;

        const newPage = Math.min(book.currentPage + pagesRead, book.pageCount || Infinity);
        const session = { date: new Date().toISOString(), pagesRead, minutesSpent, startPage: book.currentPage, endPage: newPage };
        book.currentPage = newPage;
        book.lastRead = new Date().toISOString();
        book.readingSessions.push(session);

        this.updateReadingStats(session);
        this.saveToStorage();
        return true;
    }

    /**
     * Finish reading a book
     */
    finishReading(bookItemId, rating = null, review = "", finishDate = null) {
        const index = this.agenda.currentlyReading.findIndex(item => item.id === bookItemId);
        if (index === -1) return false;

        const book = this.agenda.currentlyReading.splice(index, 1)[0];
        const finishedBook = { ...book, finishDate: finishDate || new Date().toISOString(), rating, review, isRead: true, readingTime: this.calculateTotalReadingTime(book.readingSessions) };
        this.agenda.finishedBooks.push(finishedBook);
        this.updateFinishedBookStats(finishedBook);
        this.checkGoalsCompletion();
        this.saveToStorage();
        return true;
    }

    /**
     * Utility methods for stats, goals, sessions, favorite genres, streaks
     */
    updateReadingStats(session) {
        const stats = this.agenda.readingStats;
        stats.pagesReadThisYear += session.pagesRead;
        stats.readingTimePerWeek = this.calculateWeeklyReadingTime();
        stats.readingStreak = this.calculateReadingStreak();
    }

    updateFinishedBookStats(book) {
        const stats = this.agenda.readingStats;
        const currentYear = new Date().getFullYear();
        if (new Date(book.finishDate).getFullYear() === currentYear) stats.booksReadThisYear++;
        stats.totalBooksRead++;
        if (book.rating) {
            const ratedBooks = this.agenda.finishedBooks.filter(b => b.rating);
            stats.averageRating = ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length;
        }
        stats.favoriteGenres = this.calculateFavoriteGenres();
    }

    calculateTotalReadingTime(sessions) {
        return sessions.reduce((total, s) => total + (s.minutesSpent || 0), 0);
    }

    calculateWeeklyReadingTime() {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentSessions = this.agenda.currentlyReading.flatMap(book => book.readingSessions.filter(s => new Date(s.date) >= oneWeekAgo));
        return recentSessions.reduce((total, s) => total + (s.minutesSpent || 0), 0);
    }

    calculateReadingStreak() {
        const sessions = [...this.agenda.currentlyReading.flatMap(b => b.readingSessions), ...this.agenda.finishedBooks.flatMap(b => b.readingSessions)];
        if (!sessions.length) return 0;
        const dates = new Set(sessions.map(s => new Date(s.date).toDateString()));
        let streak = 0, current = new Date();
        while (dates.has(current.toDateString())) { streak++; current.setDate(current.getDate() - 1); }
        return streak;
    }

    calculateFavoriteGenres() {
        const counts = {};
        this.agenda.finishedBooks.forEach(book => book.categories?.forEach(cat => counts[cat] = (counts[cat] || 0) + 1));
        return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([genre]) => genre);
    }

    /**
     * Goal management
     */
    setReadingGoal(targetBooks, timeframe = "year", endDate = null, description = "") {
        const goal = {
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            targetBooks,
            timeframe,
            startDate: new Date().toISOString(),
            endDate: endDate || this.calculateGoalEndDate(timeframe),
            description: description || `Read ${targetBooks} books this ${timeframe}`,
            booksCompleted: 0,
            isCompleted: false,
            progress: 0,
        };
        this.agenda.readingGoals.push(goal);
        this.saveToStorage();
        return goal;
    }

    calculateGoalEndDate(timeframe) {
        const now = new Date();
        switch (timeframe) {
            case "month": return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
            case "quarter": return new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
            case "year":
            default: return new Date(now.getFullYear(), 11, 31).toISOString();
        }
    }

    checkGoalsCompletion() {
        const now = new Date();
        this.agenda.readingGoals.forEach(goal => {
            if (!goal.isCompleted) {
                const booksThisPeriod = this.agenda.finishedBooks.filter(book => new Date(book.finishDate) >= new Date(goal.startDate) && new Date(book.finishDate) <= new Date(goal.endDate)).length;
                goal.booksCompleted = booksThisPeriod;
                goal.progress = (booksThisPeriod / goal.targetBooks) * 100;
                goal.isCompleted = booksThisPeriod >= goal.targetBooks;
                if (goal.isCompleted) this.agenda.readingStats.goalsCompleted++;
            }
        });
    }

    /**
     * Book utilities
     */
    findBookById(bookItemId) {
        for (const list of ["toReadList", "currentlyReading", "finishedBooks"]) {
            const book = this.agenda[list].find(b => b.id === bookItemId);
            if (book) return book;
        }
        return null;
    }

    getBooksByStatus(status) {
        switch (status) {
            case "toRead": return this.agenda.toReadList;
            case "reading": return this.agenda.currentlyReading;
            case "finished": return this.agenda.finishedBooks;
            default: return [];
        }
    }

    getActiveGoals() {
        const now = new Date();
        return this.agenda.readingGoals.filter(goal => !goal.isCompleted && new Date(goal.endDate) > now);
    }

    getReadingStats() {
        return this.agenda.readingStats;
    }

    getAgendaSummary() {
        return {
            toReadCount: this.agenda.toReadList.length,
            currentlyReadingCount: this.agenda.currentlyReading.length,
            finishedCount: this.agenda.finishedBooks.length,
            activeGoals: this.getActiveGoals().length,
            readingStats: this.agenda.readingStats,
        };
    }

    exportAgendaData() {
        return JSON.stringify({
            version: "1.0",
            exportDate: new Date().toISOString(),
            agenda: this.agenda,
            metadata: {
                totalBooks: this.agenda.toReadList.length + this.agenda.currentlyReading.length + this.agenda.finishedBooks.length,
                totalGoals: this.agenda.readingGoals.length,
            },
        }, null, 2);
    }

    importAgendaData(data) {
        try {
            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            if (parsed.version && parsed.agenda) this.agenda = { ...this.getDefaultAgenda(), ...parsed.agenda };
            this.saveToStorage();
            return true;
        } catch {
            return false;
        }
    }

    clearAllData() {
        this.agenda = this.getDefaultAgenda
