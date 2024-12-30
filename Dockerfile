ARG PYTHON_VERSION=3.11.7
FROM python:${PYTHON_VERSION}-slim as base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Java and other dependencies
RUN apt-get update && apt-get install -y \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

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
    uv pip install --system django channels daphne "tabula-py[all]" pandas jpype1

COPY . .

RUN chown -R appuser:appuser /app && \
    chmod -R 755 /app && \
    mkdir -p /app/logs && \
    chmod 777 /app/logs

USER appuser

EXPOSE 8080 

CMD ["daphne", "-p", "8080", "-b", "0.0.0.0", "core.asgi:application"]
