import os

dashboards = [
    "src/pages/PatientDashboard.jsx",
    "src/pages/DoctorDashboard.jsx",
    "src/pages/PharmacyDashboard.jsx",
    "src/pages/HealthWorkerDashboard.jsx"
]

for fp in dashboards:
    if os.path.exists(fp):
        with open(fp, "r") as f:
            content = f.read()
        
        # Fix borderRight logic
        content = content.replace('borderRight: "4px solid " + COLORS.primary', 'borderRight: tab === t.id ? "4px solid " + COLORS.primary : "4px solid transparent"')
        
        with open(fp, "w") as f:
            f.write(content)
        print(f"Fixed border in {fp}")
