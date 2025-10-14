// src/App.jsx
import "@/debug/testSupabase";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes";
import "./styles.css";

export default function App() {
  return <RouterProvider router={router} />;
}
