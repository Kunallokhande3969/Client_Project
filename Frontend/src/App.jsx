import { BrowserRouter as Router } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppRoutes from "./AppRoutes";


function App() {
  return (
    <Router>
      <div className="pt-16">
        <ScrollToTop />
        
        <ToastContainer
          position="top-right"
          autoClose={2000}
          theme="colored"
        />
        


        
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;