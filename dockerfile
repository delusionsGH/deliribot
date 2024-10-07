FROM denoland/deno:latest as base

WORKDIR /

COPY . ./

CMD ["run", "--allow-all", "main.js"]
