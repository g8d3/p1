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
  logging: console.log,
});

// Initialize AdminJS with inferred models
async function initialize() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection successful');

    // Fetch table names directly
    const [tables] = await sequelize.query('SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"');
    console.log('Table names:', tables.map(t => t.name));

    // Force model inference for each table
    for (const table of tables) {
      sequelize.define(table.name, {}, { tableName: table.name });
    }

    // Sync database
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