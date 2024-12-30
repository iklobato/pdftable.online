ARG PYTHON_VERSION=3.11.7
FROM python:${PYTHON_VERSION}-slim as base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

RUN pip install uv

COPY pyproject.toml ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system .[all]

COPY . .

RUN chown -R appuser:appuser /app && \
    chmod -R 755 /app && \
    mkdir -p /app/logs && \
    chmod 777 /app/logs

USER appuser

EXPOSE 8080 

CMD ["daphne", "core.asgi:application", "--port", "8080", "--bind", "0.0.0.0"]

