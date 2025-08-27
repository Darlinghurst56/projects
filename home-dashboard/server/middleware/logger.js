const crypto = require('crypto');

const logger = (req, res, next) => {
  // Generate request ID
  req.requestId = crypto.randomBytes(16).toString('hex');
  
  // Log request
  const startTime = Date.now();
  const { method, url, headers, body } = req;
  
  console.log(`[${new Date().toISOString()}] [${req.requestId}] ${method} ${url}`);
  
  // Log request details in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Headers:', JSON.stringify(headers, null, 2));
    if (body && Object.keys(body).length > 0) {
      // Don't log sensitive data
      const sanitizedBody = { ...body };
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      if (sanitizedBody.pin) sanitizedBody.pin = '[REDACTED]';
      if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
      
      console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
    }
  }
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`[${new Date().toISOString()}] [${req.requestId}] ${method} ${url} - ${res.statusCode} - ${duration}ms`);
    
    // Log response in development (truncated)
    if (process.env.NODE_ENV === 'development') {
      const responsePreview = JSON.stringify(data).substring(0, 200);
      console.log('Response preview:', responsePreview);
    }
    
    // Call original json method
    originalJson.call(this, data);
  };
  
  // Log errors
  res.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] [${req.requestId}] Error:`, err);
  });
  
  next();
};

module.exports = logger;