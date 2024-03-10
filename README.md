# smtp2discord relay
 
A simple relay to forward SMTP messages to a Discord webhook.

This uses plaintext auth and there is no rate limit system nor advanced security measures in place. This means this is not meant for public internet exposure. This is meant to be used in Docker Compose stacks and local networks only accessible by the service you want to use SMTP forwarded to Discord webhooks.

## Docker Compose Example

```yaml
version: "3"
services:
  smtp2discords:
    image: ghcr.io/danclay/smtp2discord-relay:latest
    environment:
      - SMTP_PORT=2525 # Port on the container (2525 default)
      - SMTP_USERNAME=postmaster
      - SMTP_PASSWORD=mypassword

      # Type of Discord message. Either "embed" (default) or "message"
      - MESSAGE_TYPE=embed

      # Single webhook destination (required)
      - WEBHOOK_URL=https://discord.com/api/webhooks/1234/blahblah

      # OR use a mapping of recipients to webhook URLS (Format is "EMAIL|URL,EMAIL2|URL2,EMAIL3|URL3"). This is optional.
      # The default webhook can be defined with WEBHOOK_URL or DEFAULT_WEBHOOK_URL
      - MAPPED_WEBHOOKS=email1@me.local|https://discord.com/api/webhooks/1234/blahblah,email2@me.local|https://discord.com/api/webhooks/5678/blah
    ports:
      - "2525:2525" # host:container
```

## Non-Docker Usage

1. Clone this repo with `git clone https://github.com/danclay/smtp2discord-relay.git`

2. Ensure Node JS and NPM are installed.

3. Run `npm install` then `npm run build`

4. Simply set the same environment variables and run `node dist/index.js`. You may use PM2 or anything you wish.

5. Use `git pull` and `npm run build` to update.

## Sending to This

In your SMTP config for whatever app you wish to connect, set the SMTP server to the hostname or IP of the smtp2discord service. If accessing from a local network, set the SMTP server to the IP of the Docker host. Set the port to the corresponding port your app can access (either the Docker host's exposed port or the container's in the environment variable). Ensure STARTTLS, TLS, SSL and not used. Use the username and password you set above. Messages should now be forwarded to Discord. Long messages may go beyond Discord's maximum embed size. If this is the case you can try switching to message content mode with the environment variable `MESSAGE_TYPE=message` to get more characters. However, there is still a limit to this of 2000 characters. If this is surpassed, you should probably just use a regular SMTP server sending to your email.