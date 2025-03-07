import React, { useEffect, useState } from "react";
import axios from "axios";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

const ChatApp = () => {
  const [chats, setChats] = useState(() => {
    const storedChats = localStorage.getItem("chats");
    return storedChats ? JSON.parse(storedChats) : [];
  });
  const [selectedChatIndex, setSelectedChatIndex] = useState(() => {
    const storedIndex = localStorage.getItem("selectedChatIndex");
    return storedIndex ? parseInt(storedIndex, 10) : 0;
  });
  const [conversations, setConversations] = useState(() => {
    const storedConversations = localStorage.getItem("conversations");
    return storedConversations ? JSON.parse(storedConversations) : [];
  });

  const [userId, setUserId] = useState(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      return storedUserId;
    } else {
      const newUserId = `user_${Date.now()}`;
      localStorage.setItem("userId", newUserId);
      return newUserId;
    }
  });

  const API_BASE_URL = "http://13.201.80.108";

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const currentConversationId =
          conversations[selectedChatIndex]?.conversationId;
        if (currentConversationId) {
          const response = await axios.get(
            `${API_BASE_URL}/history?user_id=${userId}&conversation_id=${currentConversationId}`
          );
          const data = response.data;

          const formattedData = data.map((chat) => ({
            user: chat.user_message,
            bot: chat.bot_response,
          }));

          const updatedChats = [...chats];
          updatedChats[selectedChatIndex] = formattedData;
          setChats(updatedChats);
          localStorage.setItem("chats", JSON.stringify(updatedChats));
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    fetchChatHistory();
  }, [userId, conversations, selectedChatIndex]);

  const handleSendMessage = async (message) => {
    const updatedChats = [...chats];

    if (!updatedChats[selectedChatIndex]) {
      updatedChats[selectedChatIndex] = [];
    }
    updatedChats[selectedChatIndex].push({ user: message });
    setChats([...updatedChats]);
    localStorage.setItem("chats", JSON.stringify(updatedChats));

    const currentConversationId =
      conversations[selectedChatIndex]?.conversationId;

    if (!currentConversationId) {
      console.error("Conversation ID is missing!");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/chat`,
        {
          message: message,
          user_id: userId,
          conversation_id: currentConversationId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const botResponse = response.data[0]?.text || "No response";
      updatedChats[selectedChatIndex].push({ bot: botResponse });
      setChats([...updatedChats]);
      localStorage.setItem("chats", JSON.stringify(updatedChats));
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const startNewConversation = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/new_conversation`, {
        user_id: userId,
      });
      const newConversationId = response.data.conversation_id;
      const newConversations = [
        ...conversations,
        { conversationId: newConversationId },
      ];
      setConversations(newConversations);
      localStorage.setItem("conversations", JSON.stringify(newConversations));
      const newChats = [...chats, []];
      setChats(newChats);
      localStorage.setItem("chats", JSON.stringify(newChats));
      const newIndex = newConversations.length - 1;
      setSelectedChatIndex(newIndex);
      localStorage.setItem("selectedChatIndex", newIndex);
      console.log("New conversation started:", newConversationId);
    } catch (error) {
      console.error("Error starting a new conversation:", error);
    }
  };

  const deleteConversation = async (index) => {
    const conversationId = conversations[index]?.conversationId;

    if (!conversationId) {
      console.error("Conversation ID is missing!");
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/conversation`, {
        data: {
          user_id: userId,
          conversation_id: conversationId,
        },
      });

      const newConversations = conversations.filter((_, i) => i !== index);
      const newChats = chats.filter((_, i) => i !== index);

      setConversations(newConversations);
      setChats(newChats);

      localStorage.setItem("conversations", JSON.stringify(newConversations));
      localStorage.setItem("chats", JSON.stringify(newChats));

      if (selectedChatIndex >= newConversations.length) {
        setSelectedChatIndex(newConversations.length - 1);
        localStorage.setItem("selectedChatIndex", newConversations.length - 1);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const selectChat = (index) => {
    setSelectedChatIndex(index);
    localStorage.setItem("selectedChatIndex", index);
  };

  return (
    <div className="chat-app h-screen flex text-gray-100">
      <ChatSidebar
        chats={chats}
        selectChat={selectChat}
        startNewConversation={startNewConversation}
        deleteConversation={deleteConversation}
        selectedChatIndex={selectedChatIndex}
      />
      <ChatWindow
        chat={chats[selectedChatIndex] || []}
        onSendMessage={handleSendMessage}
        conversationId={conversations[selectedChatIndex]?.conversationId}
      />
    </div>
  );
};

export default ChatApp;
