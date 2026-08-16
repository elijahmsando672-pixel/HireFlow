let conversations = [];
let activeUserId = null;
let activeUserName = "";
let meId = null;

function formatTime(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderConversations() {
    const list = document.getElementById("conversationList");
    if (!list) return;

    list.innerHTML = "";

    if (conversations.length === 0) {
        const empty = document.createElement("p");
        empty.className = "chat-empty";
        empty.style.padding = "24px";
        empty.textContent = "No conversations yet.";
        list.appendChild(empty);
        return;
    }

    conversations.forEach(function (conv) {
        const btn = document.createElement("button");
        btn.className = "chat-item" + (conv.userId === activeUserId ? " active" : "");
        btn.addEventListener("click", function () {
            openThread(conv.userId, conv.firstName + " " + (conv.lastName || ""));
        });

        const name = document.createElement("h4");
        name.textContent = conv.firstName + " " + (conv.lastName || "");
        if (conv.unread > 0) {
            const dot = document.createElement("span");
            dot.className = "unread-dot";
            name.appendChild(dot);
        }

        const last = document.createElement("p");
        last.className = "last";
        last.innerHTML = (conv.lastAt ? formatTime(conv.lastAt) + " · " : "") + escapeHtml(conv.lastMessage || "Say hello!");

        btn.appendChild(name);
        btn.appendChild(last);

        list.appendChild(btn);
    });
}

function renderThread(messages) {
    const head = document.getElementById("threadHead");
    const body = document.getElementById("threadMessages");
    const compose = document.getElementById("composeRow");

    if (head) head.textContent = activeUserName;

    if (!body) return;

    body.innerHTML = "";

    if (messages.length === 0) {
        const empty = document.createElement("p");
        empty.className = "chat-empty";
        empty.textContent = "No messages yet. Say hello!";
        body.appendChild(empty);
    } else {
        messages.forEach(function (msg) {
            const div = document.createElement("div");
            const sent = msg.senderId === meId;
            div.className = "message " + (sent ? "sent" : "received");
            div.textContent = msg.body;

            const time = document.createElement("span");
            time.className = "time";
            time.textContent = formatTime(msg.createdAt);
            div.appendChild(time);

            body.appendChild(div);
        });
    }

    body.scrollTop = body.scrollHeight;

    if (compose) compose.style.display = "flex";
}

async function openThread(userId, name) {
    activeUserId = userId;
    activeUserName = name;

    renderConversations();

    try {
        const data = await apiGetThread(userId);
        renderThread(data.messages);
        refreshConversations();
    } catch (error) {
        alert(error.message);
    }
}

async function refreshConversations() {
    try {
        const data = await apiGetConversations();
        conversations = data.conversations;
        renderConversations();
    } catch (error) {
        alert(error.message);
    }
}

async function sendMessage() {
    const input = document.getElementById("messageInput");
    const body = input.value.trim();

    if (!body || !activeUserId) return;

    try {
        await apiSendMessage({ recipientId: activeUserId, body: body });
        input.value = "";

        const data = await apiGetThread(activeUserId);
        renderThread(data.messages);
        refreshConversations();
    } catch (error) {
        alert(error.message);
    }
}

async function initMessages() {
    setupNav("messages");

    const params = new URLSearchParams(window.location.search);
    const userId = parseInt(params.get("user"), 10);

    try {
        const meData = await apiGetMe();
        meId = meData.user.id;
        cacheUser(meData.user);

        const data = await apiGetConversations();
        conversations = data.conversations;

        if (userId) {
            const known = conversations.find(function (conv) {
                return conv.userId === userId;
            });

            if (known) {
                await openThread(userId, known.firstName + " " + (known.lastName || ""));
            } else {
                const userData = await apiGetUser(userId);
                const user = userData.user;
                activeUserId = userId;
                activeUserName = user.firstName + " " + (user.lastName || "");
                renderConversations();
                renderThread([]);
            }
        } else {
            renderConversations();
        }
    } catch (error) {
        alert(error.message);
    }

    const sendBtn = document.getElementById("sendBtn");
    const input = document.getElementById("messageInput");

    if (sendBtn) sendBtn.addEventListener("click", sendMessage);

    if (input) {
        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") sendMessage();
        });
    }
}

document.addEventListener("DOMContentLoaded", initMessages);
