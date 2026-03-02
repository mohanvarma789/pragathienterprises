const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { logChange } = require('../utils/logger');
const validate = require('../middleware/validation');
const Joi = require('joi');

// Validation Schemas
const productSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().precision(2).required(),
    stock: Joi.number().integer().required(),
    category: Joi.string().allow('', null),
    type: Joi.string().allow('', null),
    size: Joi.string().allow('', null),
    imageUrl: Joi.string().allow('', null),
    hsn: Joi.string().allow('', null)
});

// Get all products (with pagination)
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query('SELECT * FROM products LIMIT ? OFFSET ?', [limit, offset]);
        const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM products');

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

// Get product by ID
router.get('/:id', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            const err = new Error('Product not found');
            err.status = 404;
            err.isPublic = true;
            throw err;
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

// Create product
router.post('/', validate(productSchema), async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';
        const productId = `P${require('crypto').randomUUID().split('-')[0]}`;

        const newProduct = {
            ...req.body,
            id: productId,
            createdBy: user,
            updatedBy: user
        };

        const keys = Object.keys(newProduct);
        const values = Object.values(newProduct);
        const placeholders = keys.map(() => '?').join(', ');
        const query = `INSERT INTO products (${keys.join(', ')}) VALUES (${placeholders})`;
        await pool.query(query, values);

        await logChange(pool, {
            tableName: 'products',
            recordId: productId,
            action: 'INSERT',
            newData: newProduct,
            changedBy: user
        });

        res.status(201).json(newProduct);
    } catch (err) {
        next(err);
    }
});

// Bulk Create Products
router.post('/bulk', validate(Joi.array().items(productSchema)), async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const user = req.user?.username || 'system';
        const results = [];

        for (const productData of req.body) {
            const productId = `P${require('crypto').randomUUID().split('-')[0]}`;
            const newProduct = {
                ...productData,
                id: productId,
                createdBy: user,
                updatedBy: user
            };

            const keys = Object.keys(newProduct);
            const values = Object.values(newProduct);
            const placeholders = keys.map(() => '?').join(', ');
            const query = `INSERT INTO products (${keys.join(', ')}) VALUES (${placeholders})`;
            await connection.query(query, values);
            results.push(newProduct);
        }

        await connection.commit();
        res.status(201).json({ message: `Successfully imported ${results.length} products`, count: results.length });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
});

// Update product
router.put('/:id', validate(productSchema), async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';

        // Fetch old data
        const [oldRows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (oldRows.length === 0) {
            const err = new Error('Product not found');
            err.status = 404;
            err.isPublic = true;
            throw err;
        }
        const oldData = oldRows[0];

        // Whitelist updates
        const updateData = {
            name: req.body.name,
            price: req.body.price,
            stock: req.body.stock,
            category: req.body.category,
            type: req.body.type,
            size: req.body.size,
            imageUrl: req.body.imageUrl,
            hsn: req.body.hsn,
            updatedBy: user
        };

        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const query = `UPDATE products SET ${setClause} WHERE id = ?`;
        await pool.query(query, [...values, req.params.id]);

        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        const newData = rows[0];

        await logChange(pool, {
            tableName: 'products',
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

// Delete product
router.delete('/:id', async (req, res, next) => {
    try {
        const user = req.user?.username || 'system';

        // Fetch old data
        const [oldRows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (oldRows.length > 0) {
            await logChange(pool, {
                tableName: 'products',
                recordId: req.params.id,
                action: 'DELETE',
                oldData: oldRows[0],
                changedBy: user
            });
        }

        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
