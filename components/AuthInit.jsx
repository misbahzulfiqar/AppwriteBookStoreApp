import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setAuthFromSession } from "../store/authSlices";
import authService from "../appwrite/auth/authService";

/**
 * On app load (and on every refresh), check for an existing Appwrite session.
 * If the user is already logged in, restore userData in Redux so they stay on the page.
 */
export default function AuthInit({ children }) {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const user = await authService.getCurrentUser();
        if (!cancelled) {
          dispatch(setAuthFromSession(user ?? null));
        }
      } catch {
        if (!cancelled) {
          dispatch(setAuthFromSession(null));
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
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
