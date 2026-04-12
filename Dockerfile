# Build the React frontend
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Build the FastAPI backend
FROM python:3.11-slim

# Hugging Face runs as user 1000
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY --chown=user . .

# Copy the built React app from the frontend-builder stage
COPY --from=frontend-builder --chown=user /app/frontend/dist /home/user/app/frontend/dist

# Create a data directory for persistent storage
RUN mkdir -p /home/user/app/data && chown -R user:user /home/user/app/data

USER user

ENV PORT=8080
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH
ENV TORCH_HOME=/home/user/app/data/.cache/torch
ENV HF_HOME=/home/user/app/data/.cache/huggingface
ENV XDG_CACHE_HOME=/home/user/app/data/.cache
ENV CHROMA_DB_PATH=/home/user/app/data/chroma_db
ENV SQLITE_DB_PATH=/home/user/app/data/soma_sessions.db

EXPOSE 8080

# Run Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
