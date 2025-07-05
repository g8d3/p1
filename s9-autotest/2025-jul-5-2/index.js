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
});

// Initialize AdminJS with inferred models
async function initialize() {
  try {
    // Sync database and infer models
    await sequelize.sync({ force: true });
    await sequelize.sync({ alter: true });
    // Debug: Log inferred models
    console.log('Inferred models:', Object.keys(sequelize.models));

    // Initialize AdminJS
    const adminJs = new AdminJS({
      databases: [sequelize],
      rootPath: '/admin',
      resources: Object.values(sequelize.models).map(model => ({
        resource: model,
        options: { 
          navigation: { icon: 'Database', name: model.name },
          // Ensure all CRUD actions are enabled
          actions: {
            list: { isVisible: true },
            new: { isVisible: true },
            edit: { isVisible: true },
            delete: { isVisible: true },
            show: { isVisible: true },
          },
        },
      })),
      // Optional: Customize branding for clarity
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
    console.error('Error:', err);
  }
}

initialize();