const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { logChange } = require('../utils/logger');
const validate = require('../middleware/validation');
const Joi = require('joi');

// Validation Schemas
const orderItemSchema = Joi.object({
    productId: Joi.string().required(),
    qty: Joi.number().integer().min(1).required(),
    price: Joi.number().precision(2).required()
});

const orderSchema = Joi.object({
    id: Joi.string().allow('', null),
    shopId: Joi.string().required(),
    status: Joi.string().valid('Pending', 'Urgent', 'Completed').default('Pending'),
    totalAmount: Joi.number().precision(2).required(),
    priority: Joi.string().allow('', null),
    village: Joi.string().allow('', null),
    items: Joi.array().items(orderItemSchema).min(1).required()
});

// Get all orders with their items (with pagination)
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(`
            SELECT o.*, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'productId', oi.productId,
                           'quantity', oi.quantity,
                           'price', oi.price
                       )
                   ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.orderId
            GROUP BY o.id
            ORDER BY o.orderDate DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM orders');

        const orders = rows.map(order => ({
            ...order,
            items: order.items && order.items[0]?.productId ? order.items : []
        }));

        res.json({
            data: orders,
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

// Create order with items and update stock (using transaction)
router.post('/', validate(orderSchema), async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id, shopId, status, totalAmount, priority, village, items } = req.body;
        const user = req.user?.username || 'system';
        const orderId = id || `O${Date.now()}`;

        // 1. Insert order with audit fields
        await connection.query(
            'INSERT INTO orders (id, shopId, status, totalAmount, priority, village, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, shopId, status, totalAmount, priority, village, user, user]
        );

        // 2. Insert items and update stock
        for (const item of items) {
            await connection.query(
                'INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.productId, item.qty, item.price]
            );

            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.qty, item.productId]
            );
        }

        // 3. Log the creation
        await logChange(connection, {
            tableName: 'orders',
            recordId: orderId,
            action: 'INSERT',
            newData: req.body,
            changedBy: user
        });

        await connection.commit();
        res.status(201).json({ id: orderId, ...req.body, date: new Date() });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
});

// Delete order and restore stock (using transaction)
router.delete('/:id', async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const user = req.user?.username || 'system';

        // Fetch old data for logging (order and items)
        const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (orderRows.length === 0) {
            await connection.rollback();
            const err = new Error('Order not found');
            err.status = 404;
            err.isPublic = true;
            throw err;
        }
        const [itemsRows] = await connection.query('SELECT * FROM order_items WHERE orderId = ?', [req.params.id]);
        const oldData = { ...orderRows[0], items: itemsRows };

        // 1. Restore stock
        for (const item of itemsRows) {
            await connection.query(
                'UPDATE products SET stock = stock + ? WHERE id = ?',
                [item.quantity, item.productId]
            );
        }

        // 2. Delete items
        await connection.query('DELETE FROM order_items WHERE orderId = ?', [req.params.id]);

        // 3. Delete order
        await connection.query('DELETE FROM orders WHERE id = ?', [req.params.id]);

        // 4. Log the deletion
        await logChange(connection, {
            tableName: 'orders',
            recordId: req.params.id,
            action: 'DELETE',
            oldData,
            changedBy: user
        });

        await connection.commit();
        res.status(204).send();
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
});

module.exports = router;
