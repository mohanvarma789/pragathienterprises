/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
        path: req.path,
        method: req.method
    });

    const statusCode = err.status || 500;
    let message = err.isPublic ? err.message : 'Internal Server Error';

    // Specific DB error mapping
    if (err.code === 'ER_DUP_ENTRY') {
        err.status = 409;
        message = 'Conflict: Duplicate entry detected.';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
        err.status = 400;
        message = 'Data Integrity Error: Related record missing or in use.';
    }

    res.status(err.status || statusCode).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { detail: err.message, code: err.code })
    });
};

module.exports = errorHandler;
