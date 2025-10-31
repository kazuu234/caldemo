FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt uvicorn

COPY backend /app

ENV DJANGO_SETTINGS_MODULE=server.settings

EXPOSE 8000

CMD sh -c "python manage.py migrate && uvicorn server.asgi:application --host 0.0.0.0 --port 8000"
