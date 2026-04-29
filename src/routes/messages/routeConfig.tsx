// example: src/core/routes/routeConfig.tsx (or wherever your router is built)

import MessagesPage from "."

export const messageRoute = {

  path: "messages",
  element: <MessagesPage />,
  // loader: messagesLoader, // later
}