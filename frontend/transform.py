import os
import re

pages_dir = "src/pages"
files = ["PatientDashboard.jsx", "DoctorDashboard.jsx", "PharmacyDashboard.jsx", "HealthWorkerDashboard.jsx"]

new_header = """    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Background Grid & Gradient */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "radial-gradient(circle at 50% -20%, rgba(0, 240, 255, 0.15) 0%, transparent 60%)" }}></div>
      <div style={{ position: "fixed", top: "20%", left: "10%", width: 2, height: 100, background: "var(--neon-cyan)", boxShadow: "var(--shadow-neon)", opacity: 0.5 }}></div>
      <div style={{ position: "fixed", bottom: "30%", right: "15%", width: 100, height: 2, background: "var(--neon-green)", boxShadow: "var(--shadow-neon-green)", opacity: 0.5 }}></div>

      <nav style={{ padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 80, borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(10,11,16,0.8)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ width: 12, height: 12, background: "var(--neon-cyan)", boxShadow: "var(--shadow-neon)" }}></div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 24, letterSpacing: "2px", color: "var(--text-main)" }}>SEHAT<span style={{ color: "var(--neon-cyan)" }}>SETU</span></span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <button onClick={handleLogout} className="cyber-button" style={{ padding: "8px 16px" }}>DISCONNECT</button>
        </div>
      </nav>

      <section style={{ padding: "40px 5% 80px", maxWidth: 1400, margin: "0 auto", position: "relative" }}>
        <div style={{ display: "flex", gap: 15, marginBottom: 40, borderBottom: "1px solid var(--border-dim)", paddingBottom: 20, overflowX: "auto", scrollbarWidth: "none" }}>
          {tabs.map(t => (
            <button key={t.id || t.name} onClick={() => setTab(t.id || t.name)} className={`cyber-button ${tab === (t.id || t.name) ? "cyber-button--solid" : ""}`} style={{ border: "none", background: tab === (t.id || t.name) ? "var(--neon-cyan)" : "transparent", color: tab === (t.id || t.name) ? "var(--text-dark)" : "var(--neon-cyan)" }}>
              {t.label || t.name}
            </button>
          ))}
        </div>
        <main>
"""

for fname in files:
    file_path = os.path.join(pages_dir, fname)
    if not os.path.exists(file_path): continue
    
    with open(file_path, "r") as f:
        content = f.read()

    # Replace <nav>...<div className="dashboard-layout">...<aside>...</aside><main> with new_header
    content = re.sub(r"<nav.*?>.*?</nav>", "", content, flags=re.DOTALL)
    
    # Sometimes tabs array has 'name' instead of 'label', we handled that above.
    
    # We replace from <div className="dashboard-layout"> to <main className="main-content" ... >
    content = re.sub(r'<div className="dashboard-layout">.*?<aside className="sidebar".*?</aside>\s*<main className="main-content"[^>]*>', new_header, content, flags=re.DOTALL)

    # Convert components
    content = re.sub(r"<Card(.*?)>", r'<div className="cyber-card"\1>', content)
    content = content.replace("</Card>", "</div>")
    
    content = re.sub(r"<Btn([^>]*)>", r'<button className="cyber-button"\1>', content)
    content = content.replace("</Btn>", "</button>")
    
    content = re.sub(r"<Badge(.*?)>", r'<span className="cyber-badge"\1>', content)
    content = content.replace("</Badge>", "</span>")
    
    # Replace ending wrappers. Sometimes it's </main></div></div>
    content = content.replace("</main>\n      </div>\n    </div>", "</main>\n      </section>\n    </div>")
    
    # Strip COLORS references since it breaks if COLORS is removed, but we'll just replace COLORS.* with dark theme equivalents
    content = re.sub(r"COLORS\.primaryDark", '"var(--neon-cyan)"', content)
    content = re.sub(r"COLORS\.primaryLight", '"var(--bg-panel)"', content)
    content = re.sub(r"COLORS\.primary", '"var(--neon-cyan)"', content)
    content = re.sub(r"COLORS\.secondary", '"var(--neon-green)"', content)
    content = re.sub(r"COLORS\.danger", '"var(--neon-pink)"', content)
    content = re.sub(r"COLORS\.border", '"var(--border-dim)"', content)
    content = re.sub(r"COLORS\.textMuted", '"var(--text-muted)"', content)
    content = re.sub(r"COLORS\.text", '"var(--text-main)"', content)
    content = re.sub(r"COLORS\.background", '"transparent"', content)
    
    # Replace inline colors
    content = content.replace('"#fff"', '"var(--text-main)"')
    content = content.replace('"#ffffff"', '"var(--text-main)"')
    content = content.replace('"#000"', '"var(--bg-dark)"')
    content = content.replace('"#666"', '"var(--text-muted)"')
    content = content.replace('"#333"', '"var(--text-main)"')
    content = content.replace('"#22c55e"', '"var(--neon-green)"')

    with open(file_path, "w") as f:
        f.write(content)

