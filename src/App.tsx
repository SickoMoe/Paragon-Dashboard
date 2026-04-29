import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routeBuilder } from "./util/routeBuilder";
import routesConfig from "./routesConfig";
import { DashboardFrameProvider } from "./core/DashboardFrameProvider";


function App() {
  const routes = routeBuilder(routesConfig);
  const router = createBrowserRouter(routes);

  return <DashboardFrameProvider>
  <RouterProvider router={router} />
</DashboardFrameProvider>
}

export default App;