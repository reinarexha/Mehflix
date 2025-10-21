#!/usr/bin/env python3
"""
Import movies from CSV to Supabase database
Run this script to populate your movies table with the full dataset
"""

import pandas as pd
import os
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def import_movies():
    """Import movies from CSV file to Supabase"""
    
    # Read the CSV file
    csv_path = 'src/assets/movies.csv'
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: CSV file not found at {csv_path}")
        return
    
    print(f"📖 Reading movies from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    print(f"📊 Found {len(df)} movies in CSV")
    
    # Convert DataFrame to list of dictionaries
    movies_data = df.to_dict('records')
    
    # Process in batches to avoid timeout
    batch_size = 100
    total_batches = (len(movies_data) + batch_size - 1) // batch_size
    
    print(f"🔄 Importing {len(movies_data)} movies in {total_batches} batches...")
    
    for i in range(0, len(movies_data), batch_size):
        batch = movies_data[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        
        try:
            # Insert batch into Supabase
            result = supabase.table('movies').upsert(batch).execute()
            print(f"✅ Batch {batch_num}/{total_batches}: Imported {len(batch)} movies")
            
        except Exception as e:
            print(f"❌ Error in batch {batch_num}: {e}")
            continue
    
    print("🎉 Import completed!")
    
    # Verify import
    try:
        count_result = supabase.table('movies').select('id', count='exact').execute()
        print(f"📈 Total movies in database: {count_result.count}")
    except Exception as e:
        print(f"⚠️ Could not verify count: {e}")

if __name__ == "__main__":
    import_movies()
