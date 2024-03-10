const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const axios = require('axios');

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const SMTP_PORT = process.env.SMTP_PORT || 2525;
const SMTP_USERNAME = process.env.SMTP_USERNAME;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

if (!WEBHOOK_URL) {
    console.error('WEBHOOK_URL environment variable is required');
    process.exit(1);
}
if (!SMTP_USERNAME || !SMTP_PASSWORD) {
    console.error('SMTP_USERNAME and SMTP_PASSWORD environment variables are required');
    process.exit(1);
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
                const from = parsed.from.text || 'Unknown sender';
                
                const embed = {
                    author: {
                        name: from
                    },
                    title: subject,
                    description: parsed.text,
                    timestamp: parsed.date || new Date()
                }
                // Forwarding message to Discord
                axios.post(WEBHOOK_URL, {
                    embeds: [embed]
                })
                .then(() => {
                    console.log('Email forwarded to Discord');
                })
                .catch(err => {
                    console.error('Failed to send message to Discord', err);
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