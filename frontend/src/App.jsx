import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./api/AuthContext";
import NavBar from "./components/NavBar";
import Library from "./pages/Library";
import ForYou from "./pages/ForYou";
import Explore from "./pages/Explore";
import MyList from "./pages/MyList";
import Login from "./pages/Login";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/for-you" element={<ForYou />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
