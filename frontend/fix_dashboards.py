import os
import re

dashboards = [
    "src/pages/PatientDashboard.jsx",
    "src/pages/DoctorDashboard.jsx",
    "src/pages/PharmacyDashboard.jsx",
    "src/pages/HealthWorkerDashboard.jsx"
]

def process_file(filepath):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return
        
    with open(filepath, "r") as f:
        content = f.read()

    # 1. Fix old green/purple colors to use neon tokens
    content = content.replace('"#7c3aed"', 'COLORS.primary')
    content = content.replace('"#f5f3ff"', 'COLORS.primaryLight')
    content = content.replace('"#10b981"', 'COLORS.success')
    content = content.replace('"#f8f9fa"', 'COLORS.surfaceAlt')
    content = content.replace('COLORS.surfaceAlt || "#f8f9fa"', 'COLORS.surfaceAlt')
    
    # 2. Add grid background to main wrapper
    # Replace `<div style={{ fontFamily: "var(--font-display)", minHeight: "100vh", background: COLORS.surfaceAlt }}>`
    # We will use regex to find the main return wrapper
    content = re.sub(
        r'<div style=\{\{ fontFamily: "var\(--font-display\)", minHeight: "100vh".*?\}\}>',
        '<div style={{ fontFamily: "var(--font-display)", minHeight: "100vh", background: COLORS.surfaceAlt, position: "relative" }}>\n      {/* Background Grid */}\n      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }}></div>\n      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column" }}>',
        content
    )
    
    # 3. Add closing div right before the final closing div
    content = re.sub(r'    </div>\n  \);\n}', '      </div>\n    </div>\n  );\n}', content)
    
    # 4. Clean up sidebar style overriding
    content = content.replace('borderRightColor: COLORS.primary', 'borderRight: "4px solid " + COLORS.primary')

    with open(filepath, "w") as f:
        f.write(content)

    print(f"Updated {filepath}")

for db in dashboards:
    process_file(db)

