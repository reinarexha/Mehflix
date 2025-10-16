# file: now_playing_to_csv.py
import requests
import csv

API_KEY = "e63a76072dc4651ed73da98e65a0bdc0"  # e.g. e63a76072dc4651ed73da98e65a0bdc0

url = "https://api.themoviedb.org/3/movie/now_playing"
params = {
    "api_key": API_KEY,
    "language": "en-US",
    "page": 1
}

resp = requests.get(url, params=params)
resp.raise_for_status()
data = resp.json()
movies = data.get("results", [])

csv_file = "now_playing_movies.csv"
fields = [
    "id",
    "title",
    "release_date",
    "vote_average",
    "vote_count",
    "original_language",
    "overview"
]

with open(csv_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for m in movies:
        writer.writerow({k: m.get(k, "") for k in fields})

print(f"✅ Wrote {len(movies)} rows to {csv_file}")
