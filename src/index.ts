import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import axios from 'axios';

const DEFAULT_WEBHOOK_URL = process.env.WEBHOOK_URL || process.env.DEFAULT_WEBHOOK_URL;
const SMTP_PORT = process.env.SMTP_PORT || 2525;
const SMTP_USERNAME = process.env.SMTP_USERNAME;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const MESSAGE_TYPE = process.env.MESSAGE_TYPE || 'embed';

if (!['embed', 'message'].includes(MESSAGE_TYPE)) {
    throw `Invalid MESSAGE_TYPE: ${MESSAGE_TYPE}. Options are 'embed' (default) or 'message'`;
}

if (!DEFAULT_WEBHOOK_URL) {
    throw "WEBHOOK_URL environment variable is required";
}

const getWebhookMapping = () => {
    const MAPPED_WEBHOOKS = process.env.MAPPED_WEBHOOKS;
    if (!MAPPED_WEBHOOKS) return {};
    const eachMapping = MAPPED_WEBHOOKS.split(',').map(item => item.split('|').map(subitem => subitem.trim()));
    return Object.fromEntries(eachMapping);
}
const webhookMappings = getWebhookMapping();

if (!SMTP_USERNAME || !SMTP_PASSWORD) {
    throw "SMTP_USERNAME and SMTP_PASSWORD environment variables are required";
}

const smtpServer = new SMTPServer({
    disabledCommands: ['STARTTLS'],
    secure: false,
    authOptional: false, // Require authentication
    onAuth(auth, session, callback) {
        if (auth.username === SMTP_USERNAME && auth.password === SMTP_PASSWORD) {
            return callback(null, { user: auth.username }); // Authentication succeeded
        } else {
            return callback(new Error('Invalid username or password')); // Authentication failed
        }
    },
    onData(stream, session, callback) {
        simpleParser(stream)
            .then(parsed => {
                const subject = parsed.subject || 'No subject';
                const from = parsed.from ? (parsed.from.text || 'Unknown sender') : 'Unknown sender';
                const getRecipient = () => {
                    if (parsed.to) {
                        if (Array.isArray(parsed.to)) {
                            if (parsed.to[0].value[0].address) {
                                return parsed.to[0].value[0].address;
                            }
                        } else {
                            if (parsed.to.value[0].address) {
                                return parsed.to.value[0].address;
                            }
                        }
                    }
                    return "unknown-recipient@unknown.local";
                }
                const recipient = getRecipient();

                const webhookUrl = webhookMappings[recipient] || DEFAULT_WEBHOOK_URL;
                
                const getPostRequest = () => {
                    if (MESSAGE_TYPE === 'embed') {
                        return {
                            embeds: [{
                                author: {
                                    name: from
                                },
                                title: subject,
                                description: parsed.text,
                                timestamp: parsed.date || new Date(),
                                footer: {
                                    text: `Recipient: ${recipient}`
                                }
                            }]
                        }
                    } else {
                        return {
                            content: `
                                **From:** ${from}
                                **To:** ${recipient}
                                **Subject:** ${subject}
                                **Timestamp:** ${(parsed.date || new Date()).toLocaleDateString()}
                                \`\`\`
                                ${parsed.text}
                                \`\`\`
                            `
                        }
                    }
                }

                // Forwarding message to Discord
                axios.post(webhookUrl, getPostRequest())
                .then(() => {
                    console.log(`Email from ${from} to ${recipient}: Forwarded to Discord`);
                })
                .catch(err => {
                    console.error(`Email from ${from} to ${recipient}: Failed to send message to Discord`, err);
                });
                callback(); // Accept the message
            })
            .catch(err => {
                console.error('Error parsing email', err);
                callback(err);
            });
    }
});

smtpServer.listen(SMTP_PORT, () => {
    console.log(`SMTP server listening on port ${SMTP_PORT}`);
});