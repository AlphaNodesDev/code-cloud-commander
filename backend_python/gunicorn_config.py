
# Gunicorn configuration for production
bind = "127.0.0.1:5000"
workers = 4
worker_class = "eventlet"
worker_connections = 1000
timeout = 60
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
