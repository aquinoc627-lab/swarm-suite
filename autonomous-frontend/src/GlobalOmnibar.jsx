import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNexus } from "./NexusContext";
import { MdSearch, MdRocketLaunch, MdSmartToy, MdSecurity, MdTerminal, MdClose } from "react-icons/md";
import "./GlobalOmnibar.css";

const COMMANDS = [
  { id: "recon", title: "Initiate Reconnaissance", icon: <MdSearch />, desc: "Deploy Nmap to a target subnet", action: "/arsenal" },
  { id: "lab", title: "Open 3D Agent Lab", icon: <MdSmartToy />, desc: "Create or modify AI personas", action: "/lab" },
  { id: "mission", title: "Launch New Mission", icon: <MdRocketLaunch />, desc: "Start an autonomous operation", action: "/missions" },
  { id: "terminal", title: "Access Live Terminal", icon: <MdTerminal />, desc: "View real-time execution logs", action: "/terminal" },
  { id: "arsenal", title: "Browse Tool Arsenal", icon: <MdSecurity />, desc: "View all 50+ cybersecurity tools", action: "/arsenal" },
  { id: "zenith", title: "Toggle Zenith HUD Mode", icon: <MdSearch />, desc: "Enter distraction-free spatial desktop", action: "TOGGLE_ZENITH" },
];

export default function GlobalOmnibar() {
  const { omnibarOpen, setOmnibarOpen, setZenithMode } = useNexus();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (omnibarOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [omnibarOpen]);

  if (!omnibarOpen) return null;

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) || 
    cmd.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleExecute = (cmd) => {
    if (cmd.action === "TOGGLE_ZENITH") {
      setZenithMode((prev) => !prev);
    } else {
      navigate(cmd.action);
    }
    setOmnibarOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === "Enter" && filteredCommands.length > 0) {
      e.preventDefault();
      handleExecute(filteredCommands[selectedIndex]);
    }
  };

  return (
    <div className="omnibar-overlay" onClick={() => setOmnibarOpen(false)}>
      <div className="omnibar-container" onClick={(e) => e.stopPropagation()}>
        <div className="omnibar-input-wrapper">
          <MdSearch className="omnibar-search-icon" />
          <input
            ref={inputRef}
            className="omnibar-input"
            placeholder="Type a command or search... (e.g. 'Launch Mission')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="omnibar-esc-hint">ESC</div>
        </div>
        
        <div className="omnibar-results">
          {filteredCommands.length === 0 ? (
            <div className="omnibar-no-results">No commands found. Try "recon" or "lab".</div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`omnibar-result-item ${idx === selectedIndex ? "selected" : ""}`}
                onClick={() => handleExecute(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="omnibar-result-icon">{cmd.icon}</div>
                <div className="omnibar-result-text">
                  <div className="omnibar-result-title">{cmd.title}</div>
                  <div className="omnibar-result-desc">{cmd.desc}</div>
                </div>
                <div className="omnibar-result-action">Execute</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
