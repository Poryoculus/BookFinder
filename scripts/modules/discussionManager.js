/**
 * Discussion Manager - Handles book discussion rooms and user interactions
 */
export class DiscussionManager {
  constructor() {
    this.discussions = new Map(); // Map of bookId to discussion rooms
    this.currentRoom = null;
    this.loadFromStorage();
  }

  /**
   * Load discussions from local storage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem("bookDiscussions");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.discussions = new Map(parsed);
      }
    } catch (error) {
      console.error("Error loading discussions from storage:", error);
      this.discussions = new Map();
    }
  }

  /**
   * Save discussions to local storage
   */
  saveToStorage() {
    try {
      const serialized = JSON.stringify(Array.from(this.discussions.entries()));
      localStorage.setItem("bookDiscussions", serialized);
    } catch (error) {
      console.error("Error saving discussions to storage:", error);
    }
  }

  /**
   * Create a new discussion room for a book
   * @param {string} bookId - Book identifier
   * @param {string} bookTitle - Book title
   * @param {string} bookAuthor - Book author
   * @param {string} roomName - Custom room name (optional)
   * @returns {Object} Created discussion room
   */
  createDiscussionRoom(bookId, bookTitle, bookAuthor, roomName = null) {
    const roomId = this.generateRoomId();
    const discussionRoom = {
      id: roomId,
      bookId,
      bookTitle,
      bookAuthor,
      name: roomName || `Discussion: ${bookTitle}`,
      description: `Discuss "${bookTitle}" by ${bookAuthor}`,
      createdAt: new Date().toISOString(),
      members: new Set(),
      messages: [],
      isActive: true,
      tags: this.generateDefaultTags(bookTitle),
    };

    if (!this.discussions.has(bookId)) {
      this.discussions.set(bookId, []);
    }

    this.discussions.get(bookId).push(discussionRoom);
    this.saveToStorage();

    return discussionRoom;
  }

  /**
   * Generate a unique room ID
   * @returns {string} Unique room identifier
   */
  generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate default tags based on book title
   * @param {string} bookTitle - Book title
   * @returns {Array} Array of tags
   */
  generateDefaultTags(bookTitle) {
    const words = bookTitle.toLowerCase().split(" ").slice(0, 3);
    return [...words, "book-club", "discussion"];
  }

  /**
   * Get all discussion rooms for a book
   * @param {string} bookId - Book identifier
   * @returns {Array} Array of discussion rooms
   */
  getDiscussionsForBook(bookId) {
    return this.discussions.get(bookId) || [];
  }

  /**
   * Get all active discussion rooms across all books
   * @returns {Array} Array of active discussion rooms
   */
  getAllActiveDiscussions() {
    const allRooms = [];
    for (const rooms of this.discussions.values()) {
      allRooms.push(...rooms.filter((room) => room.isActive));
    }
    return allRooms.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }

  /**
   * Join a discussion room
   * @param {string} roomId - Room identifier
   * @param {string} userName - User name
   * @returns {boolean} Success status
   */
  joinRoom(roomId, userName) {
    const room = this.findRoomById(roomId);
    if (room && room.isActive) {
      room.members.add(userName);
      this.currentRoom = room;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Leave current discussion room
   * @param {string} userName - User name
   */
  leaveRoom(userName) {
    if (this.currentRoom) {
      this.currentRoom.members.delete(userName);
      this.currentRoom = null;
      this.saveToStorage();
    }
  }

  /**
   * Post a message to a discussion room
   * @param {string} roomId - Room identifier
   * @param {string} userName - User name
   * @param {string} message - Message content
   * @param {number} rating - Book rating (1-5, optional)
   * @returns {Object} Posted message object
   */
  postMessage(roomId, userName, message, rating = null) {
    const room = this.findRoomById(roomId);
    if (!room || !room.isActive) {
      throw new Error("Discussion room not found or inactive");
    }

    const messageObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userName,
      message: message.trim(),
      rating,
      timestamp: new Date().toISOString(),
      likes: new Set(),
      replies: [],
    };

    room.messages.push(messageObj);
    room.members.add(userName); // Auto-join when posting

    // Update last activity timestamp
    room.lastActivity = new Date().toISOString();

    this.saveToStorage();
    return messageObj;
  }

  /**
   * Like a message in a discussion room
   * @param {string} roomId - Room identifier
   * @param {string} messageId - Message identifier
   * @param {string} userName - User name
   * @returns {boolean} Success status
   */
  likeMessage(roomId, messageId, userName) {
    const room = this.findRoomById(roomId);
    if (room) {
      const message = room.messages.find((msg) => msg.id === messageId);
      if (message) {
        if (message.likes.has(userName)) {
          message.likes.delete(userName); // Unlike
        } else {
          message.likes.add(userName); // Like
        }
        this.saveToStorage();
        return true;
      }
    }
    return false;
  }

  /**
   * Reply to a message in a discussion room
   * @param {string} roomId - Room identifier
   * @param {string} messageId - Parent message identifier
   * @param {string} userName - User name
   * @param {string} reply - Reply content
   * @returns {Object} Reply object
   */
  postReply(roomId, messageId, userName, reply) {
    const room = this.findRoomById(roomId);
    if (!room) {
      throw new Error("Discussion room not found");
    }

    const parentMessage = room.messages.find((msg) => msg.id === messageId);
    if (!parentMessage) {
      throw new Error("Parent message not found");
    }

    const replyObj = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userName,
      message: reply.trim(),
      timestamp: new Date().toISOString(),
    };

    parentMessage.replies.push(replyObj);
    this.saveToStorage();

    return replyObj;
  }

  /**
   * Find room by ID across all books
   * @param {string} roomId - Room identifier
   * @returns {Object} Discussion room object
   */
  findRoomById(roomId) {
    for (const rooms of this.discussions.values()) {
      const room = rooms.find((r) => r.id === roomId);
      if (room) return room;
    }
    return null;
  }

  /**
   * Get recent discussions (for homepage)
   * @param {number} limit - Maximum number of discussions to return
   * @returns {Array} Recent discussion rooms
   */
  getRecentDiscussions(limit = 5) {
    const allActive = this.getAllActiveDiscussions();
    return allActive.slice(0, limit);
  }

  /**
   * Search discussions by keyword
   * @param {string} query - Search query
   * @returns {Array} Matching discussion rooms
   */
  searchDiscussions(query) {
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const rooms of this.discussions.values()) {
      const matchingRooms = rooms.filter(
        (room) =>
          room.name.toLowerCase().includes(searchTerm) ||
          room.bookTitle.toLowerCase().includes(searchTerm) ||
          room.bookAuthor.toLowerCase().includes(searchTerm) ||
          room.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
          room.description.toLowerCase().includes(searchTerm),
      );
      results.push(...matchingRooms);
    }

    return results;
  }

  /**
   * Close a discussion room
   * @param {string} roomId - Room identifier
   * @param {string} userName - User who is closing the room
   * @returns {boolean} Success status
   */
  closeRoom(roomId, userName) {
    const room = this.findRoomById(roomId);
    if (room) {
      room.isActive = false;
      room.closedBy = userName;
      room.closedAt = new Date().toISOString();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Get discussion statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    let totalRooms = 0;
    let totalMessages = 0;
    let totalMembers = new Set();

    for (const rooms of this.discussions.values()) {
      totalRooms += rooms.length;
      rooms.forEach((room) => {
        totalMessages += room.messages.length;
        room.members.forEach((member) => totalMembers.add(member));
      });
    }

    return {
      totalRooms,
      totalMessages,
      totalMembers: totalMembers.size,
      activeRooms: this.getAllActiveDiscussions().length,
    };
  }
}
