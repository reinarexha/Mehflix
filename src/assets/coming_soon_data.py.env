import requests
import csv

# --- Your TMDB v3 API key ---
API_KEY = "e63a76072dc4651ed73da98e65a0bdc0"

# --- TMDB API endpoint ---
url = "https://api.themoviedb.org/3/movie/upcoming"

# --- Request parameters ---
params = {
    "api_key": API_KEY,
    "language": "en-US",
    "page": 1
}

# --- Send request ---
response = requests.get(url, params=params)
data = response.json()

# --- Extract movie list ---
movies = data.get("results", [])

# --- Define CSV filename ---
csv_file = "upcoming_movies.csv"

# --- Define which fields to include ---
fields = [
    "id",
    "title",
    "release_date",
    "vote_average",
    "vote_count",
    "original_language",
    "overview"
]

# --- Write to CSV ---
with open(csv_file, mode="w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=fields)
    writer.writeheader()
    for movie in movies:
        writer.writerow({field: movie.get(field, "") for field in fields})

print(f"✅ CSV file '{csv_file}' created successfully with {len(movies)} movies.")
