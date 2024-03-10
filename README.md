# smtp2discord relay
 
A simple relay to forward SMTP messages to a Discord webhook.

## Docker Compose Example:

```yaml
version: "3"
services:
  server:
    image: docker pull ghcr.io/danclay/smtp2discord-relay:latest
    environment:
      - SMTP_PORT=2525 # Port on the container
      - SMTP_USERNAME=postmaster
      - SMTP_PASSWORD=mypassword
      - WEBHOOK_URL=https://discord.com/api/webhooks/1234/blahblah
    ports:
      - 2525:2525 # host:container
```

This uses plaintext auth, not TLS/STARTTLS/SSL. This also means this is not meant for public internet exposure. This is meant to be used in Docker Compose stacks only accessible by the service you want forwarded.