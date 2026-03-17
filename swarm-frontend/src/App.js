import React, { useEffect, useState } from "react";
import SwarmView from "./SwarmView.jsx";
import MissionTimeline from "./MissionTimeline.jsx";
import BanterPanel from "./BanterPanel.jsx";
import Login from "./Login.jsx";
import "./neonTheme.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    () => !!localStorage.getItem("swarm_token")
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("swarm_token", token);
      setLoggedIn(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (!loggedIn) {
    return <Login />;
  }

  return (
    <div className="App">
      <SwarmView />
      <MissionTimeline />
      <BanterPanel />
    </div>
  );
}
export default App;
