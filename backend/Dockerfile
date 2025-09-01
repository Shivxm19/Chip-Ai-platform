# eda-backend/Dockerfile

# Use an official Python runtime as a parent image
# We choose a slim-bullseye image for a smaller footprint and active repositories.
# Bullseye is Debian 11. Python 3.10 is compatible with it.
FROM python:3.10-slim-bullseye

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for some Python packages (e.g., for pymongo)
# and for general build tools.
# apt-get update: Updates the list of available packages.
# apt-get install -y --no-install-recommends: Installs packages without recommending additional ones,
#                                            which helps keep the image size down.
# build-essential: Provides essential tools for compiling software (like gcc, g++)
# libffi-dev: Required by some cryptography libraries.
# libssl-dev: Required by some SSL/TLS related libraries.
# gnupg: Used for secure key management, often a dependency for other installs.
# ca-certificates: Ensures the container trusts common SSL certificates.
# curl: A tool to transfer data from or to a server.
# libpq-dev: Provides development files for PostgreSQL client library, often includes SSL dependencies.
# CORRECTED: Ensure '&& rm -rf /var/lib/apt/lists/*' is on the same logical line as the apt-get install.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libssl-dev \
    gnupg \
    ca-certificates \
    curl \
    libpq-dev \
    openssl \
    dnsutils \
    net-tools \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# pip install --no-cache-dir: Installs Python packages without caching them,
#                             further reducing the image size.
RUN pip install --no-cache-dir -r requirements.txt

# Ensure certifi is up-to-date
RUN pip install --no-cache-dir --upgrade certifi

# Copy the rest of the application code into the container at /app
COPY . .

# Expose the port that FastAPI will run on
EXPOSE 8000

# Command to run the application using Gunicorn (recommended for production)
# Gunicorn is a production-ready WSGI HTTP server for Python web applications.
# -w 4: Sets 4 worker processes. Adjust based on your server's CPU cores.
# -k uvicorn.workers.UvicornWorker: Specifies Uvicorn worker class for ASGI apps like FastAPI.
# main:app: Refers to the FastAPI application instance named 'app' in 'main.py'.
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]

# Alternative for development (if you prefer uvicorn directly)
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
