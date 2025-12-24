"""Gunicorn configuration for production deployment."""
import os
import multiprocessing

# Get port from environment variable (Render sets this)
port = int(os.getenv('PORT', 8000))

# Server socket
bind = f"0.0.0.0:{port}"
backlog = 2048

# Worker processes
workers = max(multiprocessing.cpu_count() - 1, 2)
worker_class = "sync"
timeout = 120
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "codeprac-backend"

# Server mechanics
daemon = False
pidfile = None
