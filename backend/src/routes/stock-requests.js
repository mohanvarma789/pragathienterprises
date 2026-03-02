const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { logChange } = require('../utils/logger');
const validate = require('../middleware/validation');
const Joi = require('joi');

const stockRequestSchema = Joi.object({
    id: Joi.string().allow('', null),
    productId: Joi.string().required(),
    shopId: Joi.string().required(),
    requestedQty: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('Pending', 'Fulfilled', 'Cancelled').default('Pending'),
    requestDate: Joi.date().default(Date.now),
    targetOrderId: Joi.string().allow('', null),
    priority: Joi.string().allow('', null)
});

// Get all stock requests
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM stock_requests');
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

// Create stock request
router.post('/', validate(stockRequestSchema), async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';
        const requestId = req.body.id || `REQ${Date.now()}`;

        const newReq = {
            ...req.body,
            id: requestId,
            createdBy: user,
            updatedBy: user
        };

        const keys = Object.keys(newReq);
        const values = Object.values(newReq);
        const placeholders = keys.map(() => '?').join(', ');
        const query = `INSERT INTO stock_requests (${keys.join(', ')}) VALUES (${placeholders})`;
        await pool.query(query, values);

        await logChange(pool, {
            tableName: 'stock_requests',
            recordId: requestId,
            action: 'INSERT',
            newData: newReq,
            changedBy: user
        });

        res.status(201).json(newReq);
    } catch (err) {
        next(err);
    }
});

// Update stock request
router.put('/:id', validate(stockRequestSchema), async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';

        // Fetch old data
        const [oldRows] = await pool.query('SELECT * FROM stock_requests WHERE id = ?', [req.params.id]);
        if (oldRows.length === 0) {
            const err = new Error('Stock request not found');
            err.status = 404;
            err.isPublic = true;
            throw err;
        }
        const oldData = oldRows[0];

        // Whitelist updates
        const updateData = {
            productId: req.body.productId,
            shopId: req.body.shopId,
            requestedQty: req.body.requestedQty,
            status: req.body.status,
            targetOrderId: req.body.targetOrderId,
            priority: req.body.priority,
            updatedBy: user
        };

        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const query = `UPDATE stock_requests SET ${setClause} WHERE id = ?`;
        await pool.query(query, [...values, req.params.id]);

        const [rows] = await pool.query('SELECT * FROM stock_requests WHERE id = ?', [req.params.id]);
        const newData = rows[0];

        await logChange(pool, {
            tableName: 'stock_requests',
            recordId: req.params.id,
            action: 'UPDATE',
            oldData,
            newData,
            changedBy: user
        });

        res.json(newData);
    } catch (err) {
        next(err);
    }
});

// Delete stock request
router.delete('/:id', async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';

        // Fetch old data
        const [oldRows] = await pool.query('SELECT * FROM stock_requests WHERE id = ?', [req.params.id]);
        if (oldRows.length > 0) {
            await logChange(pool, {
                tableName: 'stock_requests',
                recordId: req.params.id,
                action: 'DELETE',
                oldData: oldRows[0],
                changedBy: user
            });
        }

        await pool.query('DELETE FROM stock_requests WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
