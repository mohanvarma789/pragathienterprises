const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { logChange } = require('../utils/logger');
const validate = require('../middleware/validation');
const Joi = require('joi');

const backorderSchema = Joi.object({
    id: Joi.string().allow('', null),
    productId: Joi.string().required(),
    requestedQty: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('Pending', 'In Progress', 'Completed').default('Pending'),
    requestDate: Joi.date().default(Date.now)
});

// Get all backorders
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM backorders');
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

// Create backorder
router.post('/', validate(backorderSchema), async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';
        const requestId = req.body.id || `BACK${Date.now()}`;

        const newRequest = {
            ...req.body,
            id: requestId,
            createdBy: user,
            updatedBy: user
        };

        const keys = Object.keys(newRequest);
        const values = Object.values(newRequest);
        const placeholders = keys.map(() => '?').join(', ');
        const query = `INSERT INTO backorders (${keys.join(', ')}) VALUES (${placeholders})`;
        await pool.query(query, values);

        await logChange(pool, {
            tableName: 'backorders',
            recordId: requestId,
            action: 'INSERT',
            newData: newRequest,
            changedBy: user
        });

        res.status(201).json(newRequest);
    } catch (err) {
        next(err);
    }
});

// Delete backorders by product ID
router.delete('/product/:productId', async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';

        // Fetch old data for logging (might be multiple)
        const [oldRows] = await pool.query('SELECT * FROM backorders WHERE productId = ?', [req.params.productId]);

        for (const row of oldRows) {
            await logChange(pool, {
                tableName: 'backorders',
                recordId: row.id,
                action: 'DELETE',
                oldData: row,
                changedBy: user
            });
        }

        await pool.query('DELETE FROM backorders WHERE productId = ?', [req.params.productId]);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
