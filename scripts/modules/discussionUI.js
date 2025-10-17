/**
 * Discussion UI - Handles rendering and interactions for discussion features
 */
export class DiscussionUI {
  constructor(discussionManager) {
    this.discussionManager = discussionManager;
    this.currentUserName = this.getStoredUserName() || "Anonymous Reader";
  }

  /**
   * Initialize discussion UI
   */
  init() {
    this.bindEvents();
    this.renderDiscussionSection();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Event delegation for dynamic elements
    document.addEventListener("click", (e) => {
      if (e.target.closest(".create-room-btn")) {
        this.handleCreateRoom(e);
      } else if (e.target.closest(".join-room-btn")) {
        this.handleJoinRoom(e);
      } else if (e.target.closest(".post-message-btn")) {
        this.handlePostMessage(e);
      } else if (e.target.closest(".like-btn")) {
        this.handleLikeMessage(e);
      } else if (e.target.closest(".reply-btn")) {
        this.handleReplyMessage(e);
      } else if (e.target.closest(".close-room-btn")) {
        this.handleCloseRoom(e);
      }
    });

    // Search discussions
    const searchInput = document.getElementById("discussion-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.handleSearchDiscussions(e.target.value);
      });
    }

    // User name change
    const userNameInput = document.getElementById("user-name-input");
    if (userNameInput) {
      userNameInput.addEventListener("change", (e) => {
        this.setUserName(e.target.value);
      });
    }
  }

  /**
   * Render main discussion section
   */
  renderDiscussionSection() {
    const section = document.getElementById("discussion-section");
    if (!section) return;

    const stats = this.discussionManager.getStatistics();

    section.innerHTML = `
            <div class="discussion-header fade-in">
                <h2 class="section-title">Book Discussion Rooms</h2>
                <div class="discussion-stats">
                    <span>${stats.activeRooms} Active Rooms</span>
                    <span>•</span>
                    <span>${stats.totalMembers} Members</span>
                    <span>•</span>
                    <span>${stats.totalMessages} Messages</span>
                </div>
            </div>

            <div class="discussion-controls">
                <div class="user-controls">
                    <label for="user-name-input">Your Name:</label>
                    <input type="text" id="user-name-input" value="${this.currentUserName}" 
                           placeholder="Enter your name for discussions">
                </div>
                <div class="search-controls">
                    <input type="text" id="discussion-search" 
                           placeholder="Search discussions...">
                </div>
            </div>

            <div class="discussion-creation">
                <h3>Start a New Discussion</h3>
                <div class="create-room-form">
                    <input type="text" id="new-room-book-title" 
                           placeholder="Book Title (required)">
                    <input type="text" id="new-room-book-author" 
                           placeholder="Book Author (required)">
                    <input type="text" id="new-room-name" 
                           placeholder="Room Name (optional)">
                    <button class="create-room-btn">Create Discussion Room</button>
                </div>
            </div>

            <div class="discussions-container">
                <div class="recent-discussions">
                    <h3>Recent Discussions</h3>
                    <div id="recent-discussions-list" class="discussions-list"></div>
                </div>
                
                <div class="active-discussion" id="active-discussion">
                    <div class="no-room-selected">
                        <p>Select a discussion room to join the conversation</p>
                    </div>
                </div>
            </div>
        `;

    this.renderRecentDiscussions();
  }

  /**
   * Render recent discussions list
   */
  renderRecentDiscussions() {
    const container = document.getElementById("recent-discussions-list");
    if (!container) return;

    const recentDiscussions = this.discussionManager.getRecentDiscussions(10);

    if (recentDiscussions.length === 0) {
      container.innerHTML = `
                <div class="no-discussions">
                    <p>No discussions yet. Start the first one!</p>
                </div>
            `;
      return;
    }

    container.innerHTML = recentDiscussions
      .map(
        (room) => `
            <div class="discussion-room-card" data-room-id="${room.id}">
                <div class="room-header">
                    <h4 class="room-name">${room.name}</h4>
                    <span class="room-members">${room.members.size} members</span>
                </div>
                <div class="room-book">
                    <strong>${room.bookTitle}</strong> by ${room.bookAuthor}
                </div>
                <div class="room-activity">
                    <span class="message-count">${room.messages.length} messages</span>
                    <span class="last-activity">${this.formatRelativeTime(room.lastActivity || room.createdAt)}</span>
                </div>
                <button class="join-room-btn">Join Discussion</button>
            </div>
        `,
      )
      .join("");
  }

  /**
   * Render active discussion room
   * @param {string} roomId - Room identifier
   */
  renderDiscussionRoom(roomId) {
    const container = document.getElementById("active-discussion");
    const room = this.discussionManager.findRoomById(roomId);

    if (!room) {
      container.innerHTML = `
                <div class="error-message">
                    <p>Discussion room not found</p>
                </div>
            `;
      return;
    }

    container.innerHTML = `
            <div class="active-room-header">
                <h3>${room.name}</h3>
                <div class="room-actions">
                    <span class="member-count">${room.members.size} members in discussion</span>
                    <button class="close-room-btn" ${!room.isActive ? "disabled" : ""}>
                        ${room.isActive ? "Close Room" : "Room Closed"}
                    </button>
                </div>
            </div>
            
            <div class="room-book-info">
                Discussing: <strong>"${room.bookTitle}"</strong> by ${room.bookAuthor}
            </div>

            <div class="messages-container">
                <div class="messages-list" id="messages-list">
                    ${this.renderMessages(room.messages)}
                </div>
                
                ${
                  room.isActive
                    ? `
                    <div class="message-input-area">
                        <textarea id="new-message-input" 
                                  placeholder="Share your thoughts about this book..."></textarea>
                        <div class="message-actions">
                            <select id="message-rating">
                                <option value="">No rating</option>
                                <option value="1">★☆☆☆☆ (1/5)</option>
                                <option value="2">★★☆☆☆ (2/5)</option>
                                <option value="3">★★★☆☆ (3/5)</option>
                                <option value="4">★★★★☆ (4/5)</option>
                                <option value="5">★★★★★ (5/5)</option>
                            </select>
                            <button class="post-message-btn">Post Message</button>
                        </div>
                    </div>
                `
                    : `
                    <div class="room-closed-message">
                        <p>This discussion room has been closed to new messages.</p>
                    </div>
                `
                }
            </div>
        `;

    // Auto-join the room when viewing
    this.discussionManager.joinRoom(roomId, this.currentUserName);

    // Scroll to bottom of messages
    const messagesList = document.getElementById("messages-list");
    if (messagesList) {
      messagesList.scrollTop = messagesList.scrollHeight;
    }
  }

  /**
   * Render messages for a discussion room
   * @param {Array} messages - Array of message objects
   * @returns {string} HTML string
   */
  renderMessages(messages) {
    if (messages.length === 0) {
      return `
                <div class="no-messages">
                    <p>No messages yet. Start the discussion!</p>
                </div>
            `;
    }

    return messages
      .map(
        (message) => `
            <div class="message" data-message-id="${message.id}">
                <div class="message-header">
                    <span class="message-user">${message.userName}</span>
                    <span class="message-time">${this.formatRelativeTime(message.timestamp)}</span>
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
                    <button class="like-btn ${message.likes.has(this.currentUserName) ? "liked" : ""}">
                        👍 ${message.likes.size}
                    </button>
                    <button class="reply-btn">Reply</button>
                </div>
                
                ${
                  message.replies.length > 0
                    ? `
                    <div class="replies">
                        ${message.replies
                          .map(
                            (reply) => `
                            <div class="reply">
                                <div class="reply-header">
                                    <span class="reply-user">${reply.userName}</span>
                                    <span class="reply-time">${this.formatRelativeTime(reply.timestamp)}</span>
                                </div>
                                <div class="reply-content">${this.escapeHtml(reply.message)}</div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
                
                <div class="reply-form hidden">
                    <textarea class="reply-input" placeholder="Write a reply..."></textarea>
                    <button class="submit-reply-btn">Post Reply</button>
                    <button class="cancel-reply-btn">Cancel</button>
                </div>
            </div>
        `,
      )
      .join("");
  }

  /**
   * Handle create room action
   */
  handleCreateRoom() {
    const titleInput = document.getElementById("new-room-book-title");
    const authorInput = document.getElementById("new-room-book-author");
    const nameInput = document.getElementById("new-room-name");

    const bookTitle = titleInput.value.trim();
    const bookAuthor = authorInput.value.trim();
    const roomName = nameInput.value.trim();

    if (!bookTitle || !bookAuthor) {
      alert("Please enter both book title and author");
      return;
    }

    // For now, using a simple book ID - in real app, this would come from API
    const bookId = `book_${bookTitle.toLowerCase().replace(/\s+/g, "_")}`;

    const newRoom = this.discussionManager.createDiscussionRoom(
      bookId,
      bookTitle,
      bookAuthor,
      roomName || null,
    );

    // Clear form
    titleInput.value = "";
    authorInput.value = "";
    nameInput.value = "";

    // Refresh displays
    this.renderRecentDiscussions();
    this.renderDiscussionRoom(newRoom.id);

    // Show success message
    this.showNotification("Discussion room created successfully!");
  }

  /**
   * Handle join room action
   * @param {Event} e - Click event
   */
  handleJoinRoom(e) {
    const roomCard = e.target.closest(".discussion-room-card");
    if (roomCard) {
      const roomId = roomCard.dataset.roomId;
      this.renderDiscussionRoom(roomId);
    }
  }

  /**
   * Handle post message action
   */
  handlePostMessage() {
    const messageInput = document.getElementById("new-message-input");
    const ratingSelect = document.getElementById("message-rating");

    const message = messageInput.value.trim();
    const rating = ratingSelect.value ? parseInt(ratingSelect.value) : null;

    if (!message) {
      alert("Please enter a message");
      return;
    }

    const room = this.discussionManager.currentRoom;
    if (!room) {
      alert("No active discussion room");
      return;
    }

    try {
      this.discussionManager.postMessage(
        room.id,
        this.currentUserName,
        message,
        rating,
      );

      // Clear input and refresh
      messageInput.value = "";
      ratingSelect.value = "";
      this.renderDiscussionRoom(room.id);
    } catch (error) {
      alert("Error posting message: " + error.message);
    }
  }

  /**
   * Handle like message action
   * @param {Event} e - Click event
   */
  handleLikeMessage(e) {
    const messageElement = e.target.closest(".message");
    if (messageElement) {
      const messageId = messageElement.dataset.messageId;
      const room = this.discussionManager.currentRoom;

      if (room) {
        this.discussionManager.likeMessage(
          room.id,
          messageId,
          this.currentUserName,
        );
        this.renderDiscussionRoom(room.id);
      }
    }
  }

  /**
   * Handle reply to message
   * @param {Event} e - Click event
   */
  handleReplyMessage(e) {
    const messageElement = e.target.closest(".message");
    if (messageElement) {
      const replyForm = messageElement.querySelector(".reply-form");
      replyForm.classList.remove("hidden");
    }
  }

  /**
   * Handle close room action
   */
  handleCloseRoom() {
    const room = this.discussionManager.currentRoom;
    if (
      room &&
      confirm(
        "Are you sure you want to close this discussion room? This will prevent new messages.",
      )
    ) {
      this.discussionManager.closeRoom(room.id, this.currentUserName);
      this.renderDiscussionRoom(room.id);
      this.renderRecentDiscussions();
    }
  }

  /**
   * Handle discussion search
   * @param {string} query - Search query
   */
  handleSearchDiscussions(query) {
    if (query.length < 2) {
      this.renderRecentDiscussions();
      return;
    }

    const results = this.discussionManager.searchDiscussions(query);
    const container = document.getElementById("recent-discussions-list");

    if (results.length === 0) {
      container.innerHTML = `
                <div class="no-results">
                    <p>No discussions found matching "${query}"</p>
                </div>
            `;
      return;
    }

    container.innerHTML = results
      .map(
        (room) => `
            <div class="discussion-room-card" data-room-id="${room.id}">
                <div class="room-header">
                    <h4 class="room-name">${room.name}</h4>
                    <span class="room-members">${room.members.size} members</span>
                </div>
                <div class="room-book">
                    <strong>${room.bookTitle}</strong> by ${room.bookAuthor}
                </div>
                <div class="room-activity">
                    <span class="message-count">${room.messages.length} messages</span>
                    <span class="last-activity">${this.formatRelativeTime(room.lastActivity || room.createdAt)}</span>
                </div>
                <button class="join-room-btn">Join Discussion</button>
            </div>
        `,
      )
      .join("");
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Relative time string
   */
  formatRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return time.toLocaleDateString();
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get stored user name from local storage
   * @returns {string} User name
   */
  getStoredUserName() {
    return localStorage.getItem("discussionUserName");
  }

  /**
   * Set user name and store in local storage
   * @param {string} userName - User name
   */
  setUserName(userName) {
    this.currentUserName = userName.trim() || "Anonymous Reader";
    localStorage.setItem("discussionUserName", this.currentUserName);
  }

  /**
   * Show notification message
   * @param {string} message - Notification message
   */
  showNotification(message) {
    // Simple notification - could be enhanced with a proper notification system
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
      notification.remove();
    }, 3000);
  }
}
