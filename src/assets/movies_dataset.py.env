from datasets import load_dataset
import pandas as pd
from pathlib import Path

ds = load_dataset("Pablinho/movies-dataset")
df = pd.DataFrame(ds["train"])

# Ensure an ID exists for every row
if "id" not in df.columns or df["id"].isnull().any():
    df.insert(0, "id", range(1, len(df) + 1))

# Make headers Title Case to match your SQL (Id, Title, Release_date, ...)
df.columns = [c.capitalize() for c in df.columns]

# Coerce release_date to proper date; keep all rows (no dropna)
# Valid dates -> 'YYYY-MM-DD' string; invalid -> empty string
dt = pd.to_datetime(df["Release_date"], errors="coerce")
df["Release_date"] = dt.dt.strftime("%Y-%m-%d").fillna("")

# Optional: round rating to 1 decimal if present
if "Vote_average" in df.columns:
    df["Vote_average"] = pd.to_numeric(df["Vote_average"], errors="coerce").round(1)

out_path = Path(__file__).with_name("movies.csv")
df.to_csv(out_path, index=False)
print(f"✅ Saved CSV: {out_path.resolve()}")
print(f"✅ Row count: {len(df)}")
