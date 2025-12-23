"""Gunicorn configuration for production deployment."""
import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', 5000)}"
backlog = 2048

# Worker processes
workers = max(multiprocessing.cpu_count() - 1, 2)
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "codeprac-backend"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None

# SSL (if needed, configure separately)
# keyfile = None
# certfile = None
# ssl_version = None
# cert_reqs = 0
# ca_certs = None
# ciphers = None

# Application
raw_env = []
