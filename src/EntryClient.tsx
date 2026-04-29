import { createRoot, hydrateRoot } from "react-dom/client";
import Main from "./main";

// Get the root element where the app will be rendered
const rootElement = document.getElementById("app") as HTMLElement;

const renderApp = () => {
  if (rootElement.hasChildNodes()) {
    // Hydrate existing server-side-rendered content
    hydrateRoot(rootElement, <Main />);
  } else {
    // Render the app for the first time
    createRoot(rootElement).render(<Main />);
  }
};

// Call the function to render the appropriate app based on the mode
renderApp();
//