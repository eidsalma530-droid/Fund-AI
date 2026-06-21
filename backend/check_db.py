import sqlite3

conn = sqlite3.connect('fundai.db')
cur = conn.cursor()

# Total campaigns
cur.execute("SELECT COUNT(*) FROM campaigns")
total = cur.fetchone()[0]
print(f"Total campaigns in DB: {total}")

# By status
cur.execute("SELECT status, COUNT(*) FROM campaigns GROUP BY status")
print("\nBy status:")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

# List all
cur.execute("SELECT id, name, status, ai_score, gemini_advice IS NOT NULL as has_gemini FROM campaigns ORDER BY id")
print("\nAll campaigns:")
for r in cur.fetchall():
    gemini_tag = "GEMINI=YES" if r[4] else "GEMINI=NO"
    score_tag = f"score={r[3]:.2f}" if r[3] else "score=None"
    print(f"  [{r[0]:2d}] {r[2]:10s} | {score_tag:12s} | {gemini_tag:10s} | {r[1][:55]}")

conn.close()
