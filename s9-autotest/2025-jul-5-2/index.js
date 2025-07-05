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
  storage: './database.db',
});

// Initialize AdminJS with inferred models
async function initialize() {
  await sequelize.sync({ force: false });
  const adminJs = new AdminJS({
    databases: [sequelize],
    rootPath: '/admin',
    resources: Object.values(sequelize.models).map(model => ({
      resource: model,
      options: { navigation: { icon: 'Database' } }, // Ensure resources are visible in sidebar
    })),
  });

  // Set up AdminJS router
  app.use(adminJs.options.rootPath, AdminJSExpress.buildRouter(adminJs));

  // Start server
  app.listen(3000, () => console.log('AdminJS at http://localhost:3000/admin'));
}

initialize().catch(err => console.error('Error:', err));