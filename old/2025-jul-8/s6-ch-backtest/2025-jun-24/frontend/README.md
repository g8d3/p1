# Frontend for Crypto Ranking & Allocation MVP

This is a static frontend for the MVP. It uses Vanilla JS, Dexie.js (IndexedDB), and Chart.js. It connects to the backend FastAPI server for data and authentication.

## How to Run

1. Make sure the backend server is running at http://127.0.0.1:8000 (see backend/README.md).
2. Serve this folder as static files. You can use Python's built-in HTTP server:

   ```bash
   cd s6-ch-backtest/frontend
   python3 -m http.server 8080
   ```

3. Open your browser and go to: [http://localhost:8080](http://localhost:8080)

You should see the Crypto Ranking & Allocation dashboard.

---

- `index.html` — Main HTML file
- `main.js` — App logic (fetches data, renders UI)
- `style.css` — Basic styles

You can customize the backend URL in `main.js` if needed.
