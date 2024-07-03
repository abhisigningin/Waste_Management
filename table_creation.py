import json
import psycopg2

# Load parameters from JSON file
with open('nodes.json', 'r') as node_file:
    nodes = json.load(node_file)
    db_details = nodes["db"]

# Database connection parameters
db_params = {
    'dbname': db_details['DB_NAME'],
    'user': db_details['DB_USER'],
    'password': db_details['DB_PASS'],
    'host': db_details['DB_HOST'],
    'port': db_details['DB_PORT']
}

# Connect to the PostgreSQL database
conn = psycopg2.connect(**db_params)
cur = conn.cursor()

# Function to check if a table exists
def table_exists(table_name):
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = %s
        );
    """, (table_name,))
    return cur.fetchone()[0]

# Function to create tables
def create_table(table_name, columns):
    if table_exists(table_name):
        print(f"Table {table_name} already exists. Skipping creation.")
    else:
        # Filter out 'coordinates' and 'url' from columns
        filtered_columns = {col: col_type for col, col_type in columns.items() if col not in ['coordinates', 'url']}
        columns_with_types = ', '.join([f'"{col}" {col_type}' for col, col_type in filtered_columns.items()])
        create_table_query = f'CREATE TABLE "{table_name}" ({columns_with_types});'
        cur.execute(create_table_query)
        print(f"Table {table_name} created successfully.")

# Create tables based on the parameters
for table_name, columns in nodes.items():
    if table_name != 'db':  # Skip the 'db' entry which contains connection details
        create_table(table_name, columns)

# Commit the changes and close the connection
conn.commit()
cur.close()
conn.close()
