# 🚀 Hugging Face Deployment Guide: Soma AI

Follow these steps to deploy Soma to the cloud with **permanent memory**.

## 1. Setup Permanent Memory (Neo4j Aura)
Since the Hugging Face free tier resets local files, we use **Neo4j Aura** (Cloud) to ensure Soma never forgets your conversations.

1.  Go to [Neo4j Aura](https://neo4j.com/cloud/aura/) and create a free account.
2.  Create a **New Instance** (AuraDB Free).
3.  **Download the Credentials file** (it contains your Password and Connection URI).
4.  Wait for the instance to show as "Running."

## 2. Create the Hugging Face Space
1.  Log in to [Hugging Face](https://huggingface.co/).
2.  Click **New Space**.
3.  **Name**: `Soma` (or whatever you like).
4.  **SDK**: Select **Docker**.
5.  **Choose a Template**: Select "Blank."
6.  **Space Hardware**: "Free tier" is fine.
7.  Click **Create Space**.

## 3. Add Your Secrets (The Brain's Keys)
Your Space needs keys to work. Do **NOT** put these in the code.
1.  In your new Space, go to **Settings**.
2.  Scroll down to **Variables and Secrets**.
3.  Add the following **Secrets**:
    *   `GROQ_API_KEY`: Your key from [Groq Console](https://console.groq.com/keys).
    *   `NEO4J_URI`: Your Bolt URI from Neo4j Aura (e.g., `bolt://12345.databases.neo4j.io`).
    *   `NEO4J_USER`: Usually `neo4j`.
    *   `NEO4J_PASSWORD`: The password from your credentials file.

## 4. Push the Code
You can push the code using Git or the Hugging Face Web Interface.

**Via Git:**
```bash
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
git push hf main
```

## 5. What to Expect
- **Build Phase**: Hugging Face will take 2-5 minutes to build the Docker image (it installs both Node.js for the frontend and Python for the backend).
- **First Launch**: Once the status turns "Running," click the URL to open Soma!
- **Persistent Knowledge**: Even if the Space restarts, anything Soma learned and stored in the **Knowledge Graph (Neo4j)** will still be there when you come back.

---
> [!TIP]
> **Ephemeral Message**: You will see a "Ephemeral Mode" badge in the UI. This reminds you that while the *Knowledge Graph* is permanent, the *local chat history* (SQLite) might reset if you don't use the app for a while.
