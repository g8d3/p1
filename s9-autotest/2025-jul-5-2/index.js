// Use dynamic imports for ESM compatibility
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';
import express from 'express';
import { Sequelize } from 'sequelize';

// Register Sequelize adapter for AdminJS
AdminJS.registerAdapter(AdminJSSequelize);

// Initialize Express app
const app = express();

// Connect to SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/a.db', // Path to your SQLite database
});

// Automatically infer models from the database
async function initialize() {
  try {
    // Sync all defined models or infer them from the database
    await sequelize.sync({ force: false }); // force: false ensures existing tables are not dropped

    // Get all models from the database
    const models = sequelize.models;

    // Initialize AdminJS with all inferred models
    const adminJs = new AdminJS({
      databases: [sequelize],
      rootPath: '/admin',
      resources: Object.values(models).map(model => ({
        resource: model,
        options: {}, // Add customization here if needed
      })),
    });

    // Set up AdminJS with Express
    const router = AdminJSExpress.buildRouter(adminJs);
    app.use(adminJs.options.rootPath, router);

    // Start server
    app.listen(3000, () => {
      console.log('AdminJS is running at http://localhost:3000/admin');
    });
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initialize();