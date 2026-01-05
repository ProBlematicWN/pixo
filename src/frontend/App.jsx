import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import IndexGuestPage from "./pages/IndexGuestPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import RecoverPage from "./pages/RecoverPage.jsx";
import IndexUserPage from "./pages/IndexUserPage.jsx";
import IndexAfterUploadPage from "./pages/IndexAfterUploadPage.jsx";
import GalleryPage from "./pages/GalleryPage.jsx";
import UserImagePage from "./pages/UserImagePage.jsx";
import AlbumPage from "./pages/AlbumPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";


function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userObj) => {
    setUser(userObj);
  };

  const handleLogout = () => {
    setUser(null);
  };
  const handleUserUpdate = (patch) => {
  setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };


  return (
    <BrowserRouter>
      <Routes>
        {/* Главная страница для гостей */}
        <Route path="/" element={<IndexGuestPage />} />

        {/* Главная для авторизованных */}
        <Route
          path="/user"
          element={
            user ? (
              <IndexUserPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/sign-in" replace />
            )
          }
        />

        {/* Логин */}
        <Route
          path="/sign-in"
          element={<SignInPage onLogin={handleLogin} />}
        />

        {/* Регистрация */}
        <Route
          path="/sign-up"
          element={<SignUpPage onRegister={handleLogin} />}
        />

        {/* Восстановление */}
        <Route path="/recover" element={<RecoverPage />} />

        <Route path="/after-upload" element={<IndexAfterUploadPage />} />

        <Route
          path="/gallery"
          element={user ? <GalleryPage user={user} onLogout={handleLogout} /> : <Navigate to="/sign-in" replace />}
        />  
        <Route
        path="/image/:id"
        element={user ? <UserImagePage onLogout={handleLogout} /> : <Navigate to="/sign-in" replace />}
        />
        <Route
        path="/album/:id"
        element={user ? <AlbumPage user={user} onLogout={handleLogout} /> : <Navigate to="/sign-in" replace />}
        />
        <Route
        path="/settings"
        element={
          user ? (<SettingsPage user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />) : (<Navigate to="/sign-in" replace />)
          }
        />     
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;
