// List of common bot User-Agents to block
const blockedBots = [
    'curl',
    'wget',
    'python-requests',
    'urllib',
    'scrapy',
    // We omit postman or other development tools to avoid blocking local testing
];

export const botDetectionMiddleware = (req, res, next) => {
    const userAgent = req.headers['user-agent'];

    // If User-Agent is missing, it's highly suspicious (most browsers send one)
    if (!userAgent) {
        console.warn(`[BOT DETECTION] Blocked request without User-Agent from IP: ${req.ip}`);
        return res.status(403).json({
            success: false,
            message: "Forbidden: User-Agent is required."
        });
    }

    const lowerCaseUA = userAgent.toLowerCase();
    
    // Check if the user-agent matches any of our blocked bots
    const isBot = blockedBots.some(bot => lowerCaseUA.includes(bot));

    if (isBot) {
        console.warn(`[BOT DETECTION] Blocked bot (${userAgent}) from IP: ${req.ip}`);
        return res.status(403).json({
            success: false,
            message: "Forbidden: Automated bots are not allowed."
        });
    }

    next();
};
