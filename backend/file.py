import asyncio
import aiohttp
import json
import re
from datetime import datetime, timedelta
import asyncpg

# Function to create a table without type validation
async def create_table_if_not_exists(db_details, table_name, columns):
    try:
        conn = await asyncpg.connect(
            host=db_details["DB_HOST"],
            port=db_details["DB_PORT"],
            database=db_details["DB_NAME"],
            user=db_details["DB_USER"],
            password=db_details["DB_PASS"]
        )

        # Ensure the first two columns are `timestamp` and `node_id`
        column_definitions = [
            '"timestamp" timestamp with time zone',  # Add timestamp column
            '"node_id" TEXT'             # Add node_id column
        ] + [f'"{col}" {datatype}' for col, datatype in columns.items()]

        create_table_query = f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                {', '.join(column_definitions)}
            );
        """
        await conn.execute(create_table_query)
        await conn.close()
        print(f"Table '{table_name}' created or exists already.")
    except Exception as e:
        print(f"Error creating table: {e}")

# Function to save data to PostgreSQL without type validation
async def save_to_db(db_details, table_name, data):
    try:
        conn = await asyncpg.connect(
            host=db_details["DB_HOST"],
            port=db_details["DB_PORT"],
            database=db_details["DB_NAME"],
            user=db_details["DB_USER"],
            password=db_details["DB_PASS"]
        )

        # Prepare columns and values for insertion
        columns = list(data.keys())
        values = list(data.values())

        # Convert any dict or list type values to JSON strings
        values = [json.dumps(value) if isinstance(value, (dict, list)) else value for value in values]

        insert_query = f"""
            INSERT INTO {table_name} ({", ".join(columns)})
            VALUES ({", ".join(['$' + str(i + 1) for i in range(len(values))])});
        """
        await conn.execute(insert_query, *values)
        print("Data saved successfully.")

        await conn.close()
    except Exception as e:
        print(f"Error saving data to database: {e}")

def extract_node_id(url):
    if not isinstance(url, str):
        return None
    match = re.search(r'get-node/([^/]+)/latest', url)
    return match.group(1) if match else None

async def process_url(db_details, table_name, node_data):
    # Extract URLs and dynamic fields from node_data
    urls = node_data["url"]
    column_mappings = node_data.copy()
    column_mappings.pop("url", None)  # Remove URL key from column definitions

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

            # Parse the timestamp and convert to datetime
            ct_value = data["m2m:cin"]["ct"]
            ct_value = datetime.strptime(ct_value, "%Y%m%dT%H%M%S")  # Convert string to datetime

            # Adjust timestamp for +5:30 timezone
            offset = timedelta(hours=5, minutes=30)
            ct_value += offset  # Add the offset to the original timestamp

            # Prepare a dictionary to map field values
            data_dict = {
                "timestamp": ct_value,  # Map timestamp from ct_value
                "node_id": node_id      # Map node_id extracted from URL
            }

            # Handle response text for other dynamic fields
            if isinstance(resp_text, str):
                try:
                    # Remove brackets and convert string to a list
                    resp_text = resp_text.strip("[]'")  # Remove leading/trailing brackets and quotes
                    values = resp_text.split(', ')  # Split by comma and space

                    # Fill the data_dict with values based on column mappings
                    for i, (key, datatype) in enumerate(column_mappings.items()):
                        if i < len(values):
                            if datatype.lower() == "float" or datatype.lower() == "int":
                                data_dict[key] = float(values[i].strip().strip("'")) if values[i].strip() else None
                            else:
                                data_dict[key] = values[i].strip().strip("'") if values[i].strip() else None
                except ValueError as e:
                    print(f"Error parsing response text: {e}")
                    continue

            # Print to debug the prepared data
            print(f"Prepared data for insertion: {data_dict}")

            # Save to the database with the dynamically prepared data
            await save_to_db(db_details, table_name, data_dict)

async def main():
    # Read the nodes.json file
    with open('./nodes.json') as f:
        nodes = json.load(f)

    # Extract database details
    db_details = nodes["db"]

    # Infinite loop to process the task every 10 seconds
    while True:
        # Process each category in nodes.json except "db"
        for category, node_data in nodes.items():
            if category == "db":
                continue  # Skip the db key

            # Create table using the category name and its columns
            table_name = category
            column_types = node_data.copy()
            column_types.pop("url", None)  # Remove URL key from column definitions

            await create_table_if_not_exists(db_details, table_name, column_types)

            print(f"Processing URLs from category {category}:")
            await process_url(db_details, table_name, node_data)

        # Wait for 10 seconds before processing again
        print("Waiting for 10 seconds before next execution...")
        await asyncio.sleep(10)

if __name__ == "__main__":
    asyncio.run(main())
