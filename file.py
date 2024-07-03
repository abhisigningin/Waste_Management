import requests
import json
import ast
import base64
from pathlib import Path
from datetime import datetime
import re
import psycopg2
from psycopg2 import sql

# Define the path to the src directory
SRC_DIR = Path('./wastemanagement/public')
IMAGE_DIR = SRC_DIR / 'images'
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# Function to save data to PostgreSQL
def save_to_db(db_details, timestamp, node_id, bin_data, LCT, CS, Violations):
    try:
        # Convert Violations to JSON string
        violations_json = json.dumps(Violations)

        # Connect to the PostgreSQL database
        conn = psycopg2.connect(
            host=db_details["DB_HOST"],
            port=db_details["DB_PORT"],
            dbname=db_details["DB_NAME"],
            user=db_details["DB_USER"],
            password=db_details["DB_PASS"]
        )
        cursor = conn.cursor()

        # Insert data into the table
        insert_query = sql.SQL("""
            INSERT INTO wastemanagement ("Timestamp", node_id, bin_data, LCT, CS, Violations)
            VALUES (%s, %s, %s, %s, %s, %s)
        """)

        cursor.execute(insert_query, (timestamp, node_id, bin_data, LCT, CS, violations_json))
        
        # Commit the transaction
        conn.commit()
        
        # Close the cursor and connection
        cursor.close()
        conn.close()
        
        print("Data saved successfully.")
        
    except Exception as e:
        print(f"Error saving data to database: {e}")

def save_base64_image(base64_str, file_path):
    image_data = base64.b64decode(base64_str)
    with open(file_path, 'wb') as file:
        file.write(image_data)

def extract_node_id(url):
    if not isinstance(url, str):
        return None
    
    # Use regular expression to extract the node ID
    match = re.search(r'get-node/([^/]+)/latest', url)
    if match:
        return match.group(1)
    else:
        print(f"Could not extract node ID from URL: {url}")
        return None

def process_url(db_details, category, node_data):
    urls = node_data["url"]
    for url in urls:
        node_id = extract_node_id(url)
        if not node_id:
            print(f"Could not extract node ID from URL: {url}")
            continue
        
        print(f"Processing node ID: {node_id}")
        response = requests.get(url)
        data = response.json()
        resp_text = data["m2m:cin"]["con"]

        ct_value = data["m2m:cin"]["ct"]
        ct_value = datetime.strptime(ct_value, "%Y%m%dT%H%M%S").isoformat()

        if isinstance(resp_text, str):
            try:
                resp_text = ast.literal_eval(resp_text)
            except ValueError:
                print("Error evaluating resp_text as a list.")
                continue

        if isinstance(resp_text, list) and len(resp_text) > 0:
            try:
                data = json.loads(resp_text[0])
                CS = resp_text[2]
                LCT_unix = int(resp_text[1])  # Convert to integer
                LCT = datetime.fromtimestamp(LCT_unix).isoformat()
                Violations = json.loads(resp_text[3])
            except json.JSONDecodeError:
                print("Error parsing the first element of resp_text as JSON.")
                continue
        else:
            print("resp_text is not a list or is empty.")
            continue

        # Extract Base64 values
        bin1_base64 = data.get("Bin1", [None, None, None])[2]
        bin2_base64 = data.get("Bin2", [None, None, None])[2]

        bin1_status = data.get("Bin1", [None, None, None])[0]
        bin2_status = data.get("Bin2", [None, None, None])[0]
        print("Full status:", bin1_status, bin2_status)

        # Save the images
        save_base64_image(bin1_base64, IMAGE_DIR / f'{node_id}_bin1_image.png')
        save_base64_image(bin2_base64, IMAGE_DIR / f'{node_id}_bin2_image.png')

        print("Images saved successfully.")

        # Prepare bin_data as "bin1:status, bin2:status"
        bin_data = f"bin1:{bin1_status}, bin2:{bin2_status}"

        # Save to database
        save_to_db(db_details, ct_value, node_id, bin_data, LCT, CS, Violations)

# Read the nodes.json file
with open('./nodes.json') as f:
    nodes = json.load(f)

# Extract database details
db_details = nodes["db"]

# Process each category in nodes.json except "db"
for category, node_data in nodes.items():
    if category == "db":
        continue  # Skip the db key
    print(f"Processing URLs from category {category}:")
    process_url(db_details, category, node_data)
