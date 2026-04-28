# Local Setup Guide for Bangladesh Guardian Photocard Automation

This guide will walk you through setting up and running the project on your local Windows machine using VS Code.

## 1. Prerequisites

### Install Node.js
The project requires **Node.js** to run.
1. Go to [nodejs.org](https://nodejs.org/).
2. Download the **LTS** (Long Term Support) version for Windows.
3. Run the installer and follow the prompts (keep the default settings).
4. To verify the installation, open your system Command Prompt (search for `cmd` in the Start menu) and type:
   ```bash
   node -v
   ```
   You should see a version number (e.g., `v20.x.x`).

---

## 2. Project Initialization

### Extract the Project
1. Locate your project `.zip` file.
2. Right-click and select **Extract All...**.
3. Choose a folder where you want the project to live.

### Open in VS Code
1. Open **Visual Studio Code**.
2. Go to **File > Open Folder...**.
3. Navigate to the extracted folder (the one containing `package.json`) and click **Select Folder**.

---

## 3. Running the Project

### Open the Terminal in VS Code
1. In VS Code, go to the top menu: **Terminal > New Terminal**.
2. A panel will appear at the bottom of your screen.

### Run the Setup Commands
Paste the following commands into the terminal one by one:

**Step A: Install Dependencies**
This downloads all the necessary libraries needed for the app to work.
```bash
npm install
```

**Step B: Start the Development Server**
This starts the web server so you can view the app.
```bash
npm run dev
```

### Accessing the App
Once the server starts, you will see a message in the terminal like:
`  ➜  Local:   http://localhost:8080/`

1. Hold **Ctrl** and click the link in the terminal, or open your browser and go to `http://localhost:8080`.
2. The application should now be running!

---

## 4. Recommended VS Code Plugins

Since you are using the app, these plugins will help with readability and minor adjustments:

1. **Tailwind CSS IntelliSense**: Helps you see the styles being used.
2. **ESLint**: Highlights potential errors in the code.
3. **Prettier - Code formatter**: Keeps the code clean and easy to read.
4. **Auto Close Tag**: Automatically adds closing tags for HTML/React elements.

### How to install plugins:
1. Click the **Extensions** icon on the left sidebar of VS Code (it looks like 4 squares).
2. Search for the names above.
3. Click **Install**.

---

## 5. Troubleshooting

- **Port 8080 is already in use:** If you see an error saying the port is busy, Vite will usually automatically try another port (like 8081). Check the terminal output for the correct URL.
- **Node is not recognized:** If `npm install` fails with an "is not recognized" error, restart VS Code to refresh your system's PATH.
- **Browser Issues:** For the best experience, use a modern browser like Google Chrome or Microsoft Edge.
