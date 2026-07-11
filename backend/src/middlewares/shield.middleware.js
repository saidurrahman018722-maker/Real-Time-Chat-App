// Patterns to detect common SQL injection and XSS
const sqlInjectionPattern = /(union\s+select|insert\s+into|drop\s+table|update\s+.+set|delete\s+from|--|#|;|\bOR\b\s+\d+=\d+)/i;
const xssPattern = /(<script.*?>.*?<\/script>|javascript:|onerror=|onload=|eval\()/i;

const checkPayload = (payload) => {
    if (!payload) return false;
    
    if (typeof payload === 'string') {
        if (sqlInjectionPattern.test(payload) || xssPattern.test(payload)) {
            return true; // Malicious payload detected
        }
    } else if (typeof payload === 'object') {
        for (const key in payload) {
            // Check nested objects/arrays recursively
            if (checkPayload(payload[key])) {
                return true;
            }
        }
    }
    return false;
};

export const shieldMiddleware = (req, res, next) => {
    try {
        const hasMaliciousQuery = checkPayload(req.query);
        const hasMaliciousParams = checkPayload(req.params);
        const hasMaliciousBody = checkPayload(req.body);

        if (hasMaliciousQuery || hasMaliciousParams || hasMaliciousBody) {
            console.warn(`[SHIELD] Blocked malicious payload from IP: ${req.ip}`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Malicious payload detected."
            });
        }
        
        next();
    } catch (error) {
        console.error("Shield Middleware Error:", error);
        next(); // Proceed even if there is an error to not break the app for legitimate users
    }
};
