import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';
import express from 'express';
import { Sequelize, DataTypes } from 'sequelize';

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

    // Fetch table names
    const [tables] = await sequelize.query('SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"');
    console.log('Table names:', tables.map(t => t.name));

    // Dynamically infer table schemas
    for (const table of tables) {
      const [columns] = await sequelize.query(`PRAGMA table_info(${table.name})`);
      const attributes = {};
      columns.forEach(col => {
        // Map SQLite types to Sequelize types
        const typeMap = {
          INTEGER: DataTypes.INTEGER,
          TEXT: DataTypes.STRING,
          REAL: DataTypes.FLOAT,
          BLOB: DataTypes.BLOB,
          NULL: DataTypes.STRING, // Fallback for NULL type
        };
        attributes[col.name] = {
          type: typeMap[col.type] || DataTypes.STRING,
          primaryKey: col.pk === 1,
          allowNull: col.notnull === 0,
        };
      });
      sequelize.define(table.name, attributes, { tableName: table.name, timestamps: false });
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