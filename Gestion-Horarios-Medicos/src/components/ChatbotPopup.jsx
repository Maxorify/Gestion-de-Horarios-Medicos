import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, X } from "lucide-react";
import {
  TextField,
  useTheme,
  IconButton,
  Grow,
  Paper,
  Box,
} from "@mui/material";
import { tokens } from "../theme"; // Ajusta la ruta si es necesario

export default function ChatbotPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "¡Hola! ¿En qué puedo ayudarte hoy?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const togglePopup = () => setIsOpen(!isOpen);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const botResponses = [
        "Entiendo. ¿Puedes contarme más?",
        "¡Eso es interesante!",
        "Voy a investigar eso para ti.",
        "Gracias por compartir esa información.",
        "¿En qué más puedo ayudarte?",
      ];
      const randomResponse =
        botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const getBackgroundColor = () => {
    return theme.palette.mode === "dark"
      ? colors.primary[400]
      : theme.palette.background.default;
  };

  const getBotBubbleColor = () => {
    return theme.palette.mode === "dark"
      ? colors.primary[300]
      : theme.palette.grey[200];
  };

  const getHeaderColor = () => {
    return theme.palette.mode === "dark"
      ? colors.blueAccent[400]
      : colors.blueAccent[600];
  };

  const getUserBubbleColor = () => {
    return theme.palette.mode === "dark"
      ? colors.blueAccent[400]
      : theme.palette.primary.main;
  };

  return (
    <Box sx={{ position: "fixed", bottom: 16, right: 32, zIndex: 9999 }}>
      <Box sx={{ position: "relative", width: 56, height: 56 }}>
        <Grow in={isOpen} timeout={300} unmountOnExit mountOnEnter>
          <Paper
            elevation={10}
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              transform: "translateY(-100%)",
              flexDirection: "column",
              width: 320,
              height: 400,
              borderRadius: 2,
              bgcolor: getBackgroundColor(),
              border: `1px solid ${theme.palette.divider}`,
              overflow: "hidden",
              display: "flex",
            }}
          >
            <Box
              sx={{
                bgcolor: getHeaderColor(),
                color: theme.palette.getContrastText(getHeaderColor()),
                p: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box
                component="h3"
                sx={{ m: 0, fontSize: "1.125rem", fontWeight: 600 }}
              >
                Soporte de Chat
              </Box>
              <IconButton
                onClick={togglePopup}
                size="small"
                sx={{ color: "inherit" }}
              >
                <X size={18} />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    mb: 1.5,
                    display: "flex",
                    justifyContent:
                      message.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "70%",
                      px: 1.5,
                      py: 1,
                      bgcolor:
                        message.sender === "user"
                          ? getUserBubbleColor()
                          : getBotBubbleColor(),
                      color: theme.palette.getContrastText(
                        message.sender === "user"
                          ? getUserBubbleColor()
                          : getBotBubbleColor()
                      ),
                      borderRadius:
                        message.sender === "user"
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                    }}
                  >
                    <div>{message.text}</div>
                    <Box
                      sx={{
                        fontSize: "0.75rem",
                        mt: 0.5,
                        textAlign: "right",
                        color:
                          message.sender === "user"
                            ? theme.palette.grey[300]
                            : theme.palette.text.secondary,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Box>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            <Box
              sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}
            >
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  variant="outlined"
                  size="small"
                  fullWidth
                  placeholder="Escribe tu mensaje..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  sx={{
                    "& .MuiInputBase-root": {
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    },
                    "& input::placeholder": {
                      color: theme.palette.text.secondary,
                      opacity: 0.8,
                    },
                  }}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  sx={{
                    bgcolor: getHeaderColor(),
                    color: theme.palette.getContrastText(getHeaderColor()),
                    borderRadius: 1,
                    width: 40,
                    height: 40,
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.1)",
                      bgcolor: getHeaderColor(),
                    },
                    "&:active": {
                      transform: "scale(0.95)",
                    },
                  }}
                >
                  <Send size={16} />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grow>

        <Grow in={!isOpen} timeout={300} unmountOnExit mountOnEnter>
          <IconButton
            onClick={togglePopup}
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: getHeaderColor(),
              color: theme.palette.getContrastText(getHeaderColor()),
              width: 56,
              height: 56,
              boxShadow: 4,
              ml: 1.5,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "scale(1.1)",
                backgroundColor: getHeaderColor(),
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <MessageSquare size={24} />
          </IconButton>
        </Grow>
      </Box>
    </Box>
  );
}
