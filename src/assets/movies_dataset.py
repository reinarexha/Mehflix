from datasets import load_dataset
import pandas as pd
from pathlib import Path

ds = load_dataset("Pablinho/movies-dataset")
df = pd.DataFrame(ds["train"])

# Add ID if missing
if "id" not in df.columns or df["id"].isnull().any():
    df.insert(0, "id", range(1, len(df) + 1))

# Convert column names to Title case
df.columns = [c.capitalize() for c in df.columns]

# 🔧 Clean invalid or missing release dates
df["Release_date"] = pd.to_datetime(df["Release_date"], errors="coerce")

# Optional: filter out rows where date couldn’t be parsed
df = df.dropna(subset=["Release_date"])

# Save cleaned CSV
out_path = Path(__file__).with_name("movies.csv")
df.to_csv(out_path, index=False)
print(f"✅ Clean CSV saved to: {out_path.resolve()}")
