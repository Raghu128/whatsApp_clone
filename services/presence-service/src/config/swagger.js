/**
 * Swagger API Definitions — Presence
 * 
 * Task 6.11
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp Clone — Presence Service API',
      version: '1.0.0',
    },
    servers: [{ url: 'http://localhost:3004' }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
}

module.exports = { setupSwagger };
