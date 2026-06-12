# Antigravity Chatbot

A simple Node.js chatbot using Google Gemini via the Generative Language API.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set your API key:

   Windows PowerShell:

   ```powershell
        $env:GOOGLE_API_KEY = 'YOUR_REAL_KEY'
   ```

3. Install the web server dependency:

   ```bash
   npm install express
   ```

4. Run the chatbot server:

   ```bash
   npm start
   ```

   If port `5000` is already in use, start on a different port:

   ```bash
   PORT=5001 npm start
   ```

5. Open your browser to:

   ```text
   http://localhost:5000
   ```

## Usage

Type a question and press Enter. Type `exit` to stop.
