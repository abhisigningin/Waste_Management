import json
import base64
import requests
import schedule
import time
from datetime import datetime

def fetch_json_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching JSON data from {url}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {url}: {e}")
        return None

def extract_con_value(json_data):
    try:
        con_value = json_data["m2m:cin"]["con"]
        ct_value = json_data["m2m:cin"]["ct"]


        # Convert ct_value to a readable format
        ct_value = datetime.strptime(ct_value, "%Y%m%dT%H%M%S").isoformat()

        return con_value, ct_value
    except KeyError as e:
        print(f"Key not found in JSON: {e}")
        return None, None

def process_urls():
    try:
        with open('nodes.json', 'r') as f:
            nodes = json.load(f)

        for category, urls in nodes.items():
            print(f"Processing category: {category}")
            for url in urls:
                print(f"Fetching data from URL: {url}")
                json_data = fetch_json_data(url)
                if json_data:
                    con_value, ct_value = extract_con_value(json_data)
                    if con_value is not None and ct_value is not None:
                        print(f"con values: {con_value}")
                        print(f"ct value: {ct_value}")
                    else:
                        print("Failed to extract data.")
                else:
                    print("Failed to fetch JSON data.")
    except Exception as e:
        print(f"An error occurred during processing: {e}")

# Schedule the task every 1 minute
schedule.every(1).minutes.do(process_urls)

print("Scheduler started. Press Ctrl+C to exit.")

# Run the scheduler
while True:
    schedule.run_pending()
    time.sleep(1)
