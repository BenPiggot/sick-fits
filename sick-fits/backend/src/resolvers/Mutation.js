const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }


    const item = await ctx.db.mutation.createItem({
      data: {
        // how we create a relationship between the item and the user
        user: {
          connect: {
            id: ctx.request.userId
          }
        },
        ...args
      }
    }, info);

    return item;
  },
  updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = {...args};
    // remove the id from the updates
    delete updates.id;
    // run the update method
    return ctx.db.mutation.updateItem({
      data: updates,
      where: {
        id: args.id
      }
    }, info)
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id }
    // find the item
    const item = await ctx.db.query.item({ where }, `{ id title user { id }}`);
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission => {
      return ['ADMIN', 'ITEMDELETE'].includes(permission);
    })
    if (!ownsItem && !hasPermissions) {
      throw new Error('You don\'t have permission to delete this item');
    }
    // delete it
    return ctx.db.mutation.deleteItem({ where }, info)
  },
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    // hash password
    const password = await bcrypt.hash(args.password, 10);
    // create user in db
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ['USER'] }
      }
    }, info)
    // create the JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    // set JWT as cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    })
    // return user to browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email }} );
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // check if password is correct
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      throw new Error(`Invalid password`);
    }
    // generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    // set JWT as cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    })
    // return the user
    return user;
  },
    signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' }
  },
  async requestReset(parent, args, ctx, info) {
    // check if real user
    const user = await ctx.db.query.user({ where: { email: args.email }})
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`)
    }
    // set reset token and expiry
    const resetToken = (await promisify(randomBytes)(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    })
    // email reset token  
    const mailRest = await transport.sendMail({
      from: 'benpiggot',
      to: user.email,
      subject: "Your Password Reset Token",
      html: makeANiceEmail(`Your password reset token is here! \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click Here to Reset</a>`)
    })
    // return message
    return { message: 'Thanks!' }
  },
  async resetPassword(parent, args, ctx, info) {
    // check if passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error('Passwords do not match')
    }
    // check if legit reset token
    // check if token is expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error('This token is either invalid or expired')
    }
    // hash new password
    const password = await bcrypt.hash(args.password, 10);
    // save new password to the user and remove old reset token fields  
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    }, info)
    // generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET)
    // set JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    })
    // return new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // check if logged in
    if (!ctx.request.userId) {
      throw new Error('Must be logged in.')
    }
    // query the current user
    const currentUser = await ctx.db.query.user({
      where: { id: ctx.request.userId }
    }, info)
    // see if they have permission to update permissions
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE'])
    // update permissions
    return ctx.db.mutation.updateUser({
      data: {
        permissions: {
          set: args.permissions
        }
      },
      where: {
        id: args.userId
      }
    }, info)
  },
  async addToCart(parent, args, ctx, info) {
    // make sure user is signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be signed in to add to cart')
    }
    // query the user's current cart
    const [ existingCartItem ] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    })
    // check if that item is already in the cart and increment if it is
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1 }
      }, info)
    }
    // if item is not in cart, create a new item in cart
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {


    // query the user's current cart
    const cartItem = await ctx.db.query.cartItem({
      where: {
         id: args.id 
      }
    }, `{ id, user { id }}`)

    if (!cartItem) {
      throw new Error('No cart item found.')
    }

    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('You cannot delete this item')
    }

    return ctx.db.mutation.deleteCartItem({
      where: {
        id:  args.id 
      }
    }, info)
  },
  async createOrder(parent, args, ctx, info) {
    // query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be signed in to add to cart')
    }
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
      id
      name
      email
      cart {
        id
        quantity
        item { title price id description image largeImage }
      }}`
    );
      
    // recalculate the total for the price
    const amount = user.cart.reduce((tally, cartItem) => tally + cartItem.item.price * cartItem.quantity, 0)
    // create the Strip charge
    const charge = await stripe.charges.create({
      amount,
      currency: "USD",
      source: args.token
    })  
    // convert the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: {
          connect: { id: userId },
        }
      }
      delete orderItem.id;
      return orderItem;
    })
    // create the Order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: {
          connect: { id: userId },
        }
      }
    })
    // clear the user's cart, delete CartItems
    const cartItemsIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({ where: { id_in: cartItemsIds }})
    // return the order to the client
    return order;
  }
};

module.exports = Mutations;
