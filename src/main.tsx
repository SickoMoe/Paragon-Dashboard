import { Provider } from "react-redux";
import configureStoreWithPreloadedState from "./redux/store";
import App from "./App";

 
 function Main() {
  const store = configureStoreWithPreloadedState();

 return (
    <Provider store={store}>
      <App />
    </Provider>
  );
 }
  export default Main;