FROM debian:bookworm-slim as base
WORKDIR /usr/src/app

RUN apt update -y && apt install unzip curl -y
RUN curl -fsSL https://bun.sh/install | bash

FROM base as build

COPY . .

SHELL ["/bin/bash", "-c"]

ENV PATH=~/.bun/bin:$PATH

RUN bun install --production

RUN bun build ./index.ts --compile --outfile /tmp/app

FROM gcr.io/distroless/base-debian12:nonroot

WORKDIR /app
COPY --from=build /tmp/app /app

ENTRYPOINT [ "./app" ]
