const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if there is a current user ID
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user({ 
      where: { id: ctx.request.userId } 
    }, info)
  },
  async users(parent, args, ctx, info) {
    // check if they are logged
    if (!ctx.request.userId) {
      throw new Error('You must be logged in.')
    }
    // check if users have permissions
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])
    // if they have permission, return users
    return ctx.db.query.users({}, info)
  },
  async order(parent, args, ctx, info) {
    // check if they are logged
    if (!ctx.request.userId) {
      throw new Error('You must be logged in.')
    }
    // query current order
    const order = await ctx.db.query.order({
      where: { id: args.id }
    }, info)
    // check if user has permission to see this order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes('ADMIN');
    if (!ownsOrder || !hasPermissionToSeeOrder) {
      throw new Error('You cannot see this order')
    }
    // return the order
    return order;
  }
};

module.exports = Query;
