/* ================================================================
   GENERATIVE DASHBOARD STYLES
   ================================================================ */
.generative-dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.generative-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: rgba(0, 240, 255, 0.05);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
}

.generative-label {
  font-family: "Fira Code", monospace;
  font-weight: 700;
  color: var(--neon-cyan);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 16px;
}

.generative-canvas {
  flex: 1;
  min-height: 500px;
  background: #0a0d14;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Morphing / Dissolving Effect */
.generative-canvas.dissolving {
  opacity: 0;
  transform: scale(0.98);
  filter: blur(8px) contrast(1.2);
}

.generative-canvas.solid {
  opacity: 1;
  transform: scale(1);
  filter: blur(0px) contrast(1);
}

/* Fade In Up for inner widgets */
.fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ----------------------------------------------------------------
   IDLE STATE
   ---------------------------------------------------------------- */
.gen-idle-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--neon-cyan);
  font-family: "Fira Code", monospace;
  text-align: center;
}

.idle-ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px dashed rgba(0, 240, 255, 0.3);
  border-top-color: var(--neon-cyan);
  animation: spin 4s linear infinite;
  margin-bottom: 24px;
}

/* ----------------------------------------------------------------
   SHARED WIDGET STYLES
   ---------------------------------------------------------------- */
.gen-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gen-widget-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--neon-cyan);
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* ----------------------------------------------------------------
   WEB AUDIT WIDGET
   ---------------------------------------------------------------- */
.waterfall-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: "Fira Code", monospace;
  font-size: 0.8rem;
}

.waterfall-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wf-method { width: 60px; font-weight: bold; }
.wf-path { width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e0e6ed; }
.wf-status { width: 40px; text-align: right; }
.wf-bar-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  position: relative;
}
.wf-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.dom-tree-container {
  font-family: "Fira Code", monospace;
  color: #a0aab5;
  background: rgba(0, 0, 0, 0.4);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 240, 255, 0.2);
}

.dom-node {
  margin-left: 16px;
  padding: 4px 0;
  position: relative;
}

.dom-node::before {
  content: "";
  position: absolute;
  left: -12px;
  top: 12px;
  width: 8px;
  height: 1px;
  background: rgba(0, 240, 255, 0.3);
}

.dom-node.root { margin-left: 0; }
.dom-node.root::before { display: none; }

.dom-node.active-target {
  color: var(--neon-cyan);
  font-weight: bold;
}

.dom-node.vulnerable {
  color: var(--neon-red);
  font-weight: bold;
  text-shadow: 0 0 5px var(--neon-red);
  animation: pulseRed 2s infinite;
}

@keyframes pulseRed {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* ----------------------------------------------------------------
   WIFI WIDGET
   ---------------------------------------------------------------- */
.rf-stat-box {
  background: rgba(57, 255, 20, 0.05);
  border: 1px solid rgba(57, 255, 20, 0.2);
  border-radius: 8px;
  padding: 16px;
  flex: 1;
  text-align: center;
}

.rf-stat-box .label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.rf-stat-box .value {
  font-size: 1.2rem;
  font-family: "Fira Code", monospace;
  color: #fff;
}

/* ----------------------------------------------------------------
   OSINT WIDGET
   ---------------------------------------------------------------- */
.osint-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.osint-card {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 230, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  min-width: 200px;
}

.osint-card.primary-target {
  border-color: var(--neon-yellow);
}

.osint-card.sub-target {
  border-color: var(--neon-cyan);
}

.osint-card.danger {
  border-color: var(--neon-red);
  box-shadow: inset 0 0 20px rgba(255, 0, 64, 0.2);
}

.osint-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--neon-yellow);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto 12px auto;
}

.osint-card h4 {
  margin: 0 0 4px 0;
  color: #fff;
}

.osint-data {
  font-family: "Fira Code", monospace;
  font-size: 0.85rem;
  color: var(--neon-cyan);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.osint-discoveries {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.glow-pulse-yellow {
  box-shadow: 0 0 20px rgba(255, 230, 0, 0.2);
  animation: pulseYellow 3s infinite;
}

@keyframes pulseYellow {
  0% { box-shadow: 0 0 10px rgba(255, 230, 0, 0.2); }
  50% { box-shadow: 0 0 30px rgba(255, 230, 0, 0.5); }
  100% { box-shadow: 0 0 10px rgba(255, 230, 0, 0.2); }
}
