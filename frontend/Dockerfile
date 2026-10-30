# Frontend Dockerfile - Simple nginx serving static files
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a simple index.html
RUN echo '<!DOCTYPE html><html><head><title>PulseBoard</title></head><body><h1>PulseBoard Dashboard</h1><p>Monitoring platform is running.</p></body></html>' > /usr/share/nginx/html/index.html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1
