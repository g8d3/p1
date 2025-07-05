import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';
import express from 'express';
import { Sequelize } from 'sequelize';

// Register Sequelize adapter
AdminJS.registerAdapter(AdminJSSequelize);

// Initialize Express app
const app = express();

// Connect to SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/a.db',
  logging: console.log, // Enable query logging
});

// Initialize AdminJS with inferred models
async function initialize() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection successful');

    // Fetch table schemas manually
    const tables = await sequelize.getQueryInterface().showAllSchemas();
    console.log('Table schemas:', tables.map(t => t.tableName));

    // Sync database without dropping tables
    await sequelize.sync({ force: false });
    console.log('Inferred models:', Object.keys(sequelize.models));

    // Initialize AdminJS
    const adminJs = new AdminJS({
      databases: [sequelize],
      rootPath: '/admin',
      resources: Object.values(sequelize.models).map(model => ({
        resource: model,
        options: {
          navigation: { icon: 'Database', name: model.name },
          actions: { list: true, new: true, edit: true, delete: true, show: true },
        },
      })),
      branding: {
        companyName: 'SQLite Admin',
        softwareBrothers: false,
      },
    });

    // Set up AdminJS router
    app.use(adminJs.options.rootPath, AdminJSExpress.buildRouter(adminJs));

    // Start server
    app.listen(3000, () => console.log('AdminJS at http://localhost:3000/admin'));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

initialize();