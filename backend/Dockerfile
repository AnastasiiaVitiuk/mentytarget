FROM python:3.11-slim

# System libs required by lightgbm (libgomp) and general builds.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the application code.
COPY . .

# Most container hosts inject $PORT. Default to 8000 for local runs.
ENV PORT=8000
EXPOSE 8000

# Use shell form so $PORT is expanded at runtime.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
