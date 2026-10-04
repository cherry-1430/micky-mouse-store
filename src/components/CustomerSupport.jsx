import { useEffect, useState } from "react";
import API_URL from "../api/apiConfig";

export default function CustomerSupport() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------------------
  // LOGIN STATE
  // -----------------------------------------
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const checkLoginStatus = () => {
      try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCustomer(user);
        } else {
          setCustomer(null);
          setOpen(false);
          setConversation(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("User data error:", error);

        setCustomer(null);
        setOpen(false);
        setConversation(null);
        setMessages([]);
      }
    };

    // Check when component loads
    checkLoginStatus();

    // Check periodically so logout/login is detected
    const interval = setInterval(
      checkLoginStatus,
      500
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  // -----------------------------------------
  // LOGIN DETAILS
  // -----------------------------------------

  const isLoggedIn = !!customer;

  const customerName =
    customer?.name ||
    `${customer?.firstName || ""} ${
      customer?.lastName || ""
    }`.trim() ||
    "Customer";

  const customerEmail =
    customer?.email || "";

  // -----------------------------------------
  // LOAD CONVERSATION
  // -----------------------------------------

  const loadConversation = async () => {

    const token = localStorage.getItem("token");

    const response = await fetch(
  `${API_URL}/api/messages/conversations`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
    if (!isLoggedIn || !customerEmail) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/messages/conversations`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load support"
        );
      }

      const conversations =
        await response.json();

      const existing = conversations.find(
        (item) =>
          item.customerEmail ===
          customerEmail
      );

      if (existing) {
        setConversation(existing);

        const messagesResponse = await fetch(
  `${API_URL}/api/messages/conversations/${existing._id}/messages`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

        if (!messagesResponse.ok) {
          throw new Error(
            "Failed to load messages"
          );
        }

        const data =
          await messagesResponse.json();

        setMessages(
          Array.isArray(data) ? data : []
        );
      } else {
        setConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error(
        "Customer support error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // LOAD WHEN SUPPORT IS OPEN
  // -----------------------------------------

  useEffect(() => {
    if (open && isLoggedIn) {
      loadConversation();
    }
  }, [open, isLoggedIn]);

  // -----------------------------------------
  // SEND MESSAGE
  // -----------------------------------------

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || !isLoggedIn) {
      return;
    }
    const token = localStorage.getItem("token");

    try {
      setLoading(true);

      let response;

      // ---------------------------------------
      // CREATE NEW CONVERSATION
      // ---------------------------------------

      if (!conversation) {
        response = await fetch(
          `${API_URL}/api/messages/conversations`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
                Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              customerName,
              customerEmail,
              subject: "Customer Support",
              message: text,
            }),
          }
        );
      }

      // ---------------------------------------
      // SEND TO EXISTING CONVERSATION
      // ---------------------------------------

      else {
        response = await fetch(
          `${API_URL}/api/messages/messages`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              conversationId:
                conversation._id,

              senderType: "customer",

              senderName:
                customerName,

              message: text,
            }),
          }
        );
      }

      // ---------------------------------------
      // READ RESPONSE
      // ---------------------------------------

      const responseText =
        await response.text();

      console.log(
        "Support API:",
        response.status,
        responseText
      );

      if (!response.ok) {
        throw new Error(
          `Server ${response.status}: ${responseText}`
        );
      }

      const data = responseText
        ? JSON.parse(responseText)
        : {};

      // ---------------------------------------
      // NEW CONVERSATION
      // ---------------------------------------

      if (!conversation) {
        const newConversation =
          data.conversation ||
          data.data ||
          data;

        setConversation(
          newConversation
        );

        setMessages([
          {
            _id: Date.now(),

            senderType: "customer",

            senderName:
              customerName,

            message: text,

            createdAt:
              new Date().toISOString(),
          },
        ]);
      }

      // ---------------------------------------
      // EXISTING CONVERSATION
      // ---------------------------------------

      else {
        const newMessage =
          data.data ||
          data.message ||
          data;

        setMessages((current) => [
          ...current,
          newMessage,
        ]);
      }

      setMessage("");
    } catch (error) {
      console.error(
        "CUSTOMER SUPPORT SEND ERROR:",
        error
      );

      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // NOT LOGGED IN
  // -----------------------------------------

  if (!isLoggedIn) {
    return null;
  }

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <>
      {/* SUPPORT BUTTON */}

      <button
        type="button"
        className="customer-support-button"
        onClick={() => setOpen(true)}
      >
        💬 Support
      </button>

      {/* CHAT WINDOW */}

      {open && (
        <div className="customer-support-window">

          {/* HEADER */}

          <div className="customer-support-header">

            <div>
              <strong>
                SPACE WEAR SUPPORT
              </strong>

              <span>
                We're here to help
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
            >
              ×
            </button>

          </div>

          {/* MESSAGES */}

          <div className="customer-support-messages">

            {loading &&
            messages.length === 0 ? (
              <p>Loading...</p>
            ) : messages.length ===
              0 ? (

              <div className="customer-support-welcome">

                <strong>
                  Hi {customerName}! 👋
                </strong>

                <p>
                  How can we help you today?
                </p>

              </div>

            ) : (

              messages.map(
                (item, index) => (

                  <div
                    key={
                      item._id ||
                      index
                    }
                    className={`customer-support-message ${
                      item.senderType
                    }`}
                  >

                    <div>

                      <strong>
                        {item.senderType ===
                        "admin"
                          ? "SPACE WEAR"
                          : "You"}
                      </strong>

                      <p>
                        {item.message}
                      </p>

                      <small>
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )
                          : ""}
                      </small>

                    </div>

                  </div>

                )
              )

            )}

          </div>

          {/* INPUT */}

          <div className="customer-support-input">

            <textarea
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
              placeholder="Type your message..."
              rows={2}
              onKeyDown={(e) => {

                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  sendMessage();
                }

              }}
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={
                loading ||
                !message.trim()
              }
            >
              SEND →
            </button>

          </div>

        </div>
      )}
    </>
  );
}