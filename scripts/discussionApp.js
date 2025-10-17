/**
 * Discussion Room Application
 * Handles the discussion page functionality with local storage
 */

class DiscussionApp {
  constructor() {
    this.discussions = new Map();
    this.currentUser = "Book Lover";
    this.currentRoom = null;
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.loadUserPreferences();
    this.bindEvents();
    this.renderDiscussions();
    this.updateStats();
  }

  // Storage Management
  loadFromStorage() {
    try {
      const stored = localStorage.getItem("bookDiscussions");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.discussions = new Map(parsed);
      }
    } catch (error) {
      console.error("Error loading discussions:", error);
      this.discussions = new Map();
    }
  }

  saveToStorage() {
    try {
      const serialized = JSON.stringify(Array.from(this.discussions.entries()));
      localStorage.setItem("bookDiscussions", serialized);
    } catch (error) {
      console.error("Error saving discussions:", error);
    }
  }

  loadUserPreferences() {
    const savedName = localStorage.getItem("discussionUserName");
    if (savedName) {
      this.currentUser = savedName;
      document.getElementById("user-name").value = savedName;
    }
  }

  saveUserPreferences() {
    localStorage.setItem("discussionUserName", this.currentUser);
  }

  // Event Binding
  bindEvents() {
    // User name management
    document.getElementById("save-user-name").addEventListener("click", () => {
      this.saveUserName();
    });

    document.getElementById("user-name").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.saveUserName();
    });

    // Room creation
    document.getElementById("create-room").addEventListener("click", () => {
      this.createDiscussionRoom();
    });

    // Search and filters
    document.getElementById("room-search").addEventListener("input", (e) => {
      this.handleSearch(e.target.value);
    });

    document
      .getElementById("category-filter")
      .addEventListener("change", (e) => {
        this.renderDiscussions();
      });

    document.getElementById("sort-by").addEventListener("change", (e) => {
      this.renderDiscussions();
    });

    // Modal events
    document.getElementById("close-modal").addEventListener("click", () => {
      this.closeModal();
    });

    document
      .getElementById("refresh-messages")
      .addEventListener("click", () => {
        this.refreshMessages();
      });

    document.getElementById("send-message").addEventListener("click", () => {
      this.sendMessage();
    });

    document.getElementById("new-message").addEventListener("keypress", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        this.sendMessage();
      }
    });

    // Character counter
    document.getElementById("new-message").addEventListener("input", (e) => {
      this.updateCharCounter(e.target.value.length);
    });

    // Close modal on backdrop click
    document.getElementById("room-modal").addEventListener("click", (e) => {
      if (e.target.id === "room-modal") {
        this.closeModal();
      }
    });
  }

  // User Management
  saveUserName() {
    const userNameInput = document.getElementById("user-name");
    const newName = userNameInput.value.trim();

    if (newName) {
      this.currentUser = newName;
      this.saveUserPreferences();
      this.showNotification("Name saved successfully!");
      this.updateUserStats();
    } else {
      alert("Please enter a valid name");
    }
  }

  // Discussion Room Management
  createDiscussionRoom() {
    const bookTitle = document.getElementById("book-title").value.trim();
    const bookAuthor = document.getElementById("book-author").value.trim();
    const roomName = document.getElementById("room-name").value.trim();
    const description = document
      .getElementById("room-description")
      .value.trim();
    const category = document.getElementById("room-category").value;

    if (!bookTitle || !bookAuthor) {
      alert("Please enter both book title and author");
      return;
    }

    const roomId = this.generateRoomId();
    const bookId = this.generateBookId(bookTitle, bookAuthor);

    const discussionRoom = {
      id: roomId,
      bookId,
      bookTitle,
      bookAuthor,
      name: roomName || `Discussion: ${bookTitle}`,
      description: description || `Discussing "${bookTitle}" by ${bookAuthor}`,
      category,
      createdAt: new Date().toISOString(),
      createdBy: this.currentUser,
      members: new Set([this.currentUser]),
      messages: [],
      isActive: true,
      lastActivity: new Date().toISOString(),
    };

    if (!this.discussions.has(bookId)) {
      this.discussions.set(bookId, []);
    }

    this.discussions.get(bookId).push(discussionRoom);
    this.saveToStorage();

    // Clear form
    document.getElementById("book-title").value = "";
    document.getElementById("book-author").value = "";
    document.getElementById("room-name").value = "";
    document.getElementById("room-description").value = "";

    // Update UI
    this.renderDiscussions();
    this.updateStats();
    this.showNotification("Discussion room created successfully!");

    // Open the new room
    this.openRoomModal(roomId);
  }

  generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBookId(title, author) {
    return `book_${title.toLowerCase().replace(/\s+/g, "_")}_${author.toLowerCase().replace(/\s+/g, "_")}`;
  }

  // Room Display and Filtering
  renderDiscussions() {
    const grid = document.getElementById("discussions-grid");
    const emptyState = document.getElementById("empty-state");
    const discussions = this.getAllDiscussions();

    if (discussions.length === 0) {
      grid.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";
    grid.innerHTML = discussions
      .map((room) => this.createRoomCard(room))
      .join("");

    // Add click events to room cards
    grid.querySelectorAll(".discussion-room-card").forEach((card) => {
      card.addEventListener("click", () => {
        const roomId = card.dataset.roomId;
        this.openRoomModal(roomId);
      });
    });
  }

  getAllDiscussions() {
    const searchTerm = document
      .getElementById("room-search")
      .value.toLowerCase();
    const categoryFilter = document.getElementById("category-filter").value;
    const sortBy = document.getElementById("sort-by").value;

    let allRooms = [];
    for (const rooms of this.discussions.values()) {
      allRooms.push(...rooms.filter((room) => room.isActive));
    }

    // Apply filters
    if (searchTerm) {
      allRooms = allRooms.filter(
        (room) =>
          room.name.toLowerCase().includes(searchTerm) ||
          room.bookTitle.toLowerCase().includes(searchTerm) ||
          room.bookAuthor.toLowerCase().includes(searchTerm) ||
          room.description.toLowerCase().includes(searchTerm),
      );
    }

    if (categoryFilter !== "all") {
      allRooms = allRooms.filter((room) => room.category === categoryFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        allRooms.sort(
          (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity),
        );
        break;
      case "active":
        allRooms.sort((a, b) => b.messages.length - a.messages.length);
        break;
      case "members":
        allRooms.sort((a, b) => b.members.size - a.members.size);
        break;
      case "messages":
        allRooms.sort((a, b) => b.messages.length - a.messages.length);
        break;
    }

    return allRooms;
  }

  createRoomCard(room) {
    const messageCount = room.messages.length;
    const memberCount = room.members.size;
    const lastActivity = this.formatRelativeTime(room.lastActivity);

    return `
            <div class="discussion-room-card" data-room-id="${room.id}">
                <div class="room-header">
                    <h4 class="room-name">${this.escapeHtml(room.name)}</h4>
                    <span class="room-category ${room.category}">${room.category}</span>
                </div>
                <div class="book-info">
                    <strong>${this.escapeHtml(room.bookTitle)}</strong> by ${this.escapeHtml(room.bookAuthor)}
                </div>
                <p class="room-description">${this.escapeHtml(room.description)}</p>
                <div class="room-stats">
                    <div class="room-meta">
                        <span>💬 ${messageCount} messages</span>
                        <span>👥 ${memberCount} members</span>
                    </div>
                    <span class="room-activity">${lastActivity}</span>
                </div>
            </div>
        `;
  }

  // Modal Management
  openRoomModal(roomId) {
    const room = this.findRoomById(roomId);
    if (!room) {
      alert("Discussion room not found");
      return;
    }

    this.currentRoom = room;
    this.updateModalContent(room);
    document.getElementById("room-modal").classList.remove("hidden");

    // Join the room
    this.joinRoom(roomId);
  }

  updateModalContent(room) {
    document.getElementById("modal-room-name").textContent = room.name;
    document.getElementById("modal-book-title").textContent = room.bookTitle;
    document.getElementById("modal-book-author").textContent = room.bookAuthor;
    document.getElementById("modal-room-category").textContent = room.category;
    document.getElementById("modal-room-members").textContent =
      `${room.members.size} members`;
    document.getElementById("modal-room-activity").textContent =
      `Last activity: ${this.formatRelativeTime(room.lastActivity)}`;
    document.getElementById("modal-room-description").textContent =
      room.description;

    this.renderMessages(room.messages);
  }

  closeModal() {
    document.getElementById("room-modal").classList.add("hidden");
    this.currentRoom = null;
    document.getElementById("new-message").value = "";
    this.updateCharCounter(0);
  }

  // Message Management
  joinRoom(roomId) {
    const room = this.findRoomById(roomId);
    if (room && !room.members.has(this.currentUser)) {
      room.members.add(this.currentUser);
      room.lastActivity = new Date().toISOString();
      this.saveToStorage();
      this.updateStats();
    }
  }

  sendMessage() {
    if (!this.currentRoom) return;

    const messageInput = document.getElementById("new-message");
    const ratingSelect = document.getElementById("message-rating");

    const message = messageInput.value.trim();
    const rating = ratingSelect.value ? parseInt(ratingSelect.value) : null;

    if (!message) {
      alert("Please enter a message");
      return;
    }

    if (message.length > 500) {
      alert("Message must be 500 characters or less");
      return;
    }

    const messageObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userName: this.currentUser,
      message: message,
      rating,
      timestamp: new Date().toISOString(),
      likes: new Set(),
      replies: [],
    };

    this.currentRoom.messages.push(messageObj);
    this.currentRoom.lastActivity = new Date().toISOString();
    this.currentRoom.members.add(this.currentUser);

    this.saveToStorage();
    this.renderMessages(this.currentRoom.messages);
    this.updateStats();
    this.renderDiscussions();

    // Clear input
    messageInput.value = "";
    ratingSelect.value = "";
    this.updateCharCounter(0);

    // Scroll to bottom
    const messagesList = document.getElementById("messages-list");
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  renderMessages(messages) {
    const container = document.getElementById("messages-list");

    if (messages.length === 0) {
      container.innerHTML = `
                <div class="no-messages">
                    <p>No messages yet. Start the discussion!</p>
                </div>
            `;
      return;
    }

    container.innerHTML = messages
      .map((msg) => this.createMessageElement(msg))
      .join("");

    // Add like button events
    container.querySelectorAll(".like-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleLikeMessage(btn.dataset.messageId);
      });
    });
  }

  createMessageElement(message) {
    const isLiked = message.likes.has(this.currentUser);
    const likeCount = message.likes.size;
    const timeAgo = this.formatRelativeTime(message.timestamp);

    return `
            <div class="message" data-message-id="${message.id}">
                <div class="message-header">
                    <span class="message-user">${this.escapeHtml(message.userName)}</span>
                    <span class="message-time">${timeAgo}</span>
                    ${
                      message.rating
                        ? `
                        <span class="message-rating">${"★".repeat(message.rating)}${"☆".repeat(5 - message.rating)}</span>
                    `
                        : ""
                    }
                </div>
                <div class="message-content">${this.escapeHtml(message.message)}</div>
                <div class="message-actions">
                    <button class="like-btn ${isLiked ? "liked" : ""}" data-message-id="${message.id}">
                        👍 ${likeCount}
                    </button>
                </div>
            </div>
        `;
  }

  handleLikeMessage(messageId) {
    if (!this.currentRoom) return;

    const message = this.currentRoom.messages.find(
      (msg) => msg.id === messageId,
    );
    if (message) {
      if (message.likes.has(this.currentUser)) {
        message.likes.delete(this.currentUser);
      } else {
        message.likes.add(this.currentUser);
      }

      this.currentRoom.lastActivity = new Date().toISOString();
      this.saveToStorage();
      this.renderMessages(this.currentRoom.messages);
      this.renderDiscussions();
    }
  }

  refreshMessages() {
    if (this.currentRoom) {
      this.renderMessages(this.currentRoom.messages);
      this.showNotification("Messages refreshed");
    }
  }

  // Search and Filter
  handleSearch(query) {
    this.renderDiscussions();
  }

  // Utility Functions
  findRoomById(roomId) {
    for (const rooms of this.discussions.values()) {
      const room = rooms.find((r) => r.id === roomId);
      if (room) return room;
    }
    return null;
  }

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

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  updateCharCounter(count) {
    document.getElementById("char-counter").textContent = count;
  }

  // Statistics
  updateStats() {
    this.updateGlobalStats();
    this.updateUserStats();
  }

  updateGlobalStats() {
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

    document.getElementById("total-rooms").textContent = totalRooms;
    document.getElementById("total-messages").textContent = totalMessages;
    document.getElementById("total-members").textContent = totalMembers.size;
  }

  updateUserStats() {
    let joinedRooms = 0;
    let postedMessages = 0;

    for (const rooms of this.discussions.values()) {
      rooms.forEach((room) => {
        if (room.members.has(this.currentUser)) {
          joinedRooms++;
          postedMessages += room.messages.filter(
            (msg) => msg.userName === this.currentUser,
          ).length;
        }
      });
    }

    document.getElementById("joined-rooms").textContent = joinedRooms;
    document.getElementById("posted-messages").textContent = postedMessages;
  }

  // Notifications
  showNotification(message) {
    // Simple notification implementation
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2F4F4F;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new DiscussionApp();
});
