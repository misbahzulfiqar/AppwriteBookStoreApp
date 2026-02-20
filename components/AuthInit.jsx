import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setAuthFromSession } from "../store/authSlices";

/** Frontend-only: no backend. Mark auth as checked so app can render. */
export default function AuthInit({ children }) {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    dispatch(setAuthFromSession(null));
    setReady(true);
  }, [dispatch]);

  if (!ready) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#e9e2da" }}
      >
        <div className="text-center">
          <div
            className="inline-block w-10 h-10 rounded-full border-4 border-[var(--dark-color)] border-t-transparent"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
          <p className="mt-3 text-[var(--dark-color)]">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}
