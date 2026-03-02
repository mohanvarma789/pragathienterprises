const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { logChange } = require('../utils/logger');
const validate = require('../middleware/validation');
const Joi = require('joi');

// Validation Schemas
const shopSchema = Joi.object({
    name: Joi.string().required(),
    address: Joi.string().allow('', null),
    village: Joi.string().required(),
    district: Joi.string().required(),
    pincode: Joi.string().allow('', null),
    gstin: Joi.string().allow('', null),
    mobile: Joi.string().allow('', null),
    isActive: Joi.boolean().default(true)
});

// Get all shops (with pagination)
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query('SELECT * FROM shops LIMIT ? OFFSET ?', [limit, offset]);
        const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM shops');

        res.json({
            data: rows,
            meta: {
                total: totalRows[0].count,
                page,
                limit,
                totalPages: Math.ceil(totalRows[0].count / limit)
            }
        });
    } catch (err) {
        next(err);
    }
});

// Get shop by ID
router.get('/:id', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM shops WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            const err = new Error('Shop not found');
            err.status = 404;
            err.isPublic = true;
            throw err;
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

// Create shop
router.post('/', validate(shopSchema), async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';
        const shopId = `S${require('crypto').randomUUID().split('-')[0]}`;

        const newShop = {
            ...req.body,
            id: shopId,
            createdBy: user,
            updatedBy: user
        };

        const keys = Object.keys(newShop);
        const values = Object.values(newShop);
        const placeholders = keys.map(() => '?').join(', ');
        const query = `INSERT INTO shops (${keys.join(', ')}) VALUES (${placeholders})`;
        await pool.query(query, values);

        await logChange(pool, {
            tableName: 'shops',
            recordId: shopId,
            action: 'INSERT',
            newData: newShop,
            changedBy: user
        });

        res.status(201).json(newShop);
    } catch (err) {
        next(err);
    }
});

// Bulk Create Shops
router.post('/bulk', validate(Joi.array().items(shopSchema)), async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const user = req.user?.username || 'system';
        const results = [];

        for (const shopData of req.body) {
            const shopId = `S${require('crypto').randomUUID().split('-')[0]}`;
            const newShop = {
                ...shopData,
                id: shopId,
                createdBy: user,
                updatedBy: user
            };

            const keys = Object.keys(newShop);
            const values = Object.values(newShop);
            const placeholders = keys.map(() => '?').join(', ');
            const query = `INSERT INTO shops (${keys.join(', ')}) VALUES (${placeholders})`;
            await connection.query(query, values);
            results.push(newShop);
        }

        await connection.commit();
        res.status(201).json({ message: `Successfully imported ${results.length} shops`, count: results.length });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
});

// Update shop
router.put('/:id', validate(shopSchema), async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';

        // Fetch old data
        const [oldRows] = await pool.query('SELECT * FROM shops WHERE id = ?', [req.params.id]);
        if (oldRows.length === 0) {
            const err = new Error('Shop not found');
            err.status = 404;
            err.isPublic = true;
            throw err;
        }
        const oldData = oldRows[0];

        // Whitelist updates
        const updateData = {
            name: req.body.name,
            address: req.body.address,
            village: req.body.village,
            district: req.body.district,
            pincode: req.body.pincode,
            gstin: req.body.gstin,
            mobile: req.body.mobile,
            isActive: req.body.isActive,
            updatedBy: user
        };

        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const query = `UPDATE shops SET ${setClause} WHERE id = ?`;
        await pool.query(query, [...values, req.params.id]);

        const [rows] = await pool.query('SELECT * FROM shops WHERE id = ?', [req.params.id]);
        const newData = rows[0];

        await logChange(pool, {
            tableName: 'shops',
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

// Delete shop
router.delete('/:id', async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';

        // Fetch old data
        const [oldRows] = await pool.query('SELECT * FROM shops WHERE id = ?', [req.params.id]);
        if (oldRows.length > 0) {
            await logChange(pool, {
                tableName: 'shops',
                recordId: req.params.id,
                action: 'DELETE',
                oldData: oldRows[0],
                changedBy: user
            });
        }

        await pool.query('DELETE FROM shops WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
