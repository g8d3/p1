#!/bin/bash
# Setup script for the DEX Funding Rate Arbitrage DB and Web App
# Assumes PostgreSQL is running on localhost:5432 with db 'dex_arb' and user 'postgres'
# Run: chmod +x setup.sh && ./setup.sh

DB_NAME="dex_arb"
DB_USER="postgres"
DB_PASS=${DB_PASS:-""}  # Set via env var: export DB_PASS=yourpassword
DB_HOST="localhost"
DB_PORT="5432"

# Set PGPASSWORD to avoid prompts if password is set
if [ -n "$DB_PASS" ]; then
    export PGPASSWORD="$DB_PASS"
fi

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "PostgreSQL not running. Starting..."
    sudo systemctl start postgresql
    sleep 2
fi

# Drop and create DB
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;" -d postgres
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" -d postgres

# Run schema creation
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < schema.sql

# Run initial data inserts
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < initial_data.sql

# Setup Directus (recommended tool for auto-generating CRUD web app)
# Install Node.js if needed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

npm install -g @directus/cli

# Create Directus project
npx create-directus-project directus-app

# Configure .env in directus-app
cat > directus-app/.env <<EOF
DB_CLIENT=pg
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_DATABASE=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
KEY=your-random-key-change-this
SECRET=your-random-secret-change-this
EOF

# Start Directus (auto-discovers schema, generates admin UI for all tables)
cd directus-app && npm run dev

echo "Setup complete! Directus runs at http://localhost:8055"
echo "Login as admin@directus.io / password (change immediately)"
echo "Use the admin UI to manage data, roles, and extend with custom logic."
echo "For custom frontend (trader dashboard), build on Directus API: https://docs.directus.io/reference/introduction.html"