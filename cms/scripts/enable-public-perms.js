/*
  Enable Public role permissions for feed-item and upload
  Usage: node ./scripts/enable-public-perms.js
*/

const { createStrapi } = require('@strapi/strapi');

async function main() {
  const app = await createStrapi();
  await app.register();
  await app.bootstrap();

  const roleService = app.plugins['users-permissions'].services.role;
  const permissionService = app.plugins['users-permissions'].services.providers; // not used, keep for ref

  const publicRole = await roleService.getRole('public');
  if (!publicRole) {
    throw new Error('Public role not found');
  }

  // Load current permissions
  const roleId = publicRole.id;
  const updatePermissions = async () => {
    // feed-item find/findOne
    await app.query('plugin::users-permissions.permission').updateMany({
      where: { role: roleId, action: 'api::feed-item.feed-item.find' },
      data: { enabled: true }
    });
    await app.query('plugin::users-permissions.permission').updateMany({
      where: { role: roleId, action: 'api::feed-item.feed-item.findOne' },
      data: { enabled: true }
    });
    // upload read permissions
    await app.query('plugin::users-permissions.permission').updateMany({
      where: { role: roleId, action: 'plugin::upload.read' },
      data: { enabled: true }
    });
    // For Strapi v5, also enable file & folder read actions if exist
    await app.query('plugin::users-permissions.permission').updateMany({
      where: { role: roleId, action: 'plugin::upload.assets.find' },
      data: { enabled: true }
    });
    await app.query('plugin::users-permissions.permission').updateMany({
      where: { role: roleId, action: 'plugin::upload.assets.findOne' },
      data: { enabled: true }
    });
  };

  await updatePermissions();
  console.log('Public role permissions updated.');
  await app.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


