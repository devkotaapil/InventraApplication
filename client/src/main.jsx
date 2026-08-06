import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// APP MOUNT: Wrapped in StrictMode for early side-effect detection in development
// ReactDOM.createRoot(rootElement).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <AuthProvider>
//         <App />
//         {/* GLOBAL TOAST CONFIG: Centralized notification styling & duration limits */}
//         <Toaster 
//           position="top-right"
//           toastOptions={{
//             duration: 4000,
//             style: {
//               background: '#1e293b',
//               color: '#fff',
//             },
//           }}
//         />
//       </AuthProvider>
//     </BrowserRouter>
//   </React.StrictMode>
// );
