# Smart Farming Web Application

A starter Smart Farming web application that helps users explore crop information, view sample market prices, and read basic farming guidance.

## Technologies
- HTML, CSS, JavaScript
- Python (Flask)
- MySQL (optional database setup included)

## Features
- Crop information cards
- Sample crop market prices
- Basic farming guidance
- Simple responsive interface

## Run locally
1. Install Python 3.
2. Open a terminal in this folder.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the app:
   ```bash
   python app.py
   ```
5. Open `http://127.0.0.1:5000` in your browser.

## MySQL setup (optional)
1. Create a database using `database.sql`.
2. Set environment variables `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
3. The starter app currently uses sample data so it can run without MySQL. You can extend it to read/write database records.

## Important
Market prices and crop information in this starter project are sample/demo data, not live agricultural advice or live market prices. Update and verify them before real-world use.
