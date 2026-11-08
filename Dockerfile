FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_PUBLISHABLE_KEY" && npm run build

FROM python:3.13-slim
WORKDIR /app
COPY backend/requirements.txt backend/requirements-postgres.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt -r /app/backend/requirements-postgres.txt \
    && useradd --create-home --uid 10001 apex
COPY backend/app/ /app/backend/app/
COPY content/ /app/content/
COPY --from=frontend-build /app/frontend/dist/ /app/frontend/dist/
ENV PYTHONPATH=/app/backend APP_MODE=hosted AUTO_BACKUP=false PORT=8080
USER apex
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
