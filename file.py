import asyncio
import aiohttp
import json
import ast
import base64
from pathlib import Path
from datetime import datetime
import re
import asyncpg  # Use asyncpg for asynchronous PostgreSQL operations

# Define the path to the src directory
SRC_DIR = Path('./wastemanagement/public')
IMAGE_DIR = SRC_DIR / 'images'
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# Function to save data to PostgreSQL
async def save_to_db(db_details, timestamp, node_id, bin_data, LCT, CS, Violations):
    try:
        # Convert Violations to JSON string
        violations_json = json.dumps(Violations)

        # Connect to the PostgreSQL database
        conn = await asyncpg.connect(
            host=db_details["DB_HOST"],
            port=db_details["DB_PORT"],
            database=db_details["DB_NAME"],
            user=db_details["DB_USER"],
            password=db_details["DB_PASS"]
        )

        # Insert data into the table
        insert_query = """
            INSERT INTO wastemanagement ("Timestamp", node_id, bin_data, LCT, CS, Violations)
            VALUES ($1, $2, $3, $4, $5, $6)
        """

        await conn.execute(insert_query, timestamp, node_id, bin_data, LCT, CS, violations_json)
        
        # Close the connection
        await conn.close()
        
        print("Data saved successfully.")
        
    except Exception as e:
        print(f"Error saving data to database: {e}")

async def save_base64_image(base64_str, file_path):
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

async def process_url(db_details, category, node_data):
    urls = node_data["url"]
    async with aiohttp.ClientSession() as session:
        for url in urls:
            node_id = extract_node_id(url)
            if not node_id:
                print(f"Could not extract node ID from URL: {url}")
                continue
            
            print(f"Processing node ID: {node_id}")
            async with session.get(url) as response:
                data = await response.json()
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
                    
                    try:
                        LCT_unix = int(resp_text[1])  # Attempt to convert to integer
                        LCT = datetime.fromtimestamp(LCT_unix).isoformat()
                    except ValueError:
                        print(f"Invalid LCT value received: {resp_text[1]}")
                        LCT = "Invalid LCT"

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

            # Save the images only if the Base64 string is valid
            if bin1_base64:
                try:
                    await save_base64_image(bin1_base64, IMAGE_DIR / f'{node_id}_bin1_image.png')
                except Exception as e:
                    print(f"Failed to save bin1 image: {e}")
            else:
                print("bin1 image is invalid or missing. Skipping...")

            if bin2_base64:
                try:
                    await save_base64_image(bin2_base64, IMAGE_DIR / f'{node_id}_bin2_image.png')
                except Exception as e:
                    print(f"Failed to save bin2 image: {e}")
            else:
                print("bin2 image is invalid or missing. Skipping...")

            # Prepare bin_data as "bin1:status, bin2:status"
            bin_data = f"bin1:{bin1_status}, bin2:{bin2_status}"

            # Save to database
            await save_to_db(db_details, ct_value, node_id, bin_data, LCT, CS, Violations)

async def main():
    # Read the nodes.json file
    with open('./nodes.json') as f:
        nodes = json.load(f)

    # Extract database details
    db_details = nodes["db"]

    while True:
        # Process each category in nodes.json except "db"
        for category, node_data in nodes.items():
            if category == "db":
                continue  # Skip the db key
            print(f"Processing URLs from category {category}:")
            await process_url(db_details, category, node_data)
        
        # Wait for 1 minute before processing again
        await asyncio.sleep(60)

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
