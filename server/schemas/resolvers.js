const { AuthenticationError } = require('apollo-server-express');
const { Book, User } = require('../models');
const { signToken } = require('../utils/auth');


const resolvers = {
    Query: {
        // getSingleUser - can change to "me"
        // findOne
        // _id:context.user._id
        // ask for help with this query
        findOne: async (parent, args, context) => {
            const foundUser = await User.findOne({
                $or: [{ _id: context.user._id}, { username: args.username }],
                // can be replaced by context
              });
          
              if (!foundUser) {
                throw new AuthenticationError("Cannot find a user with this id!")
              }
              return foundUser;          
        },
    },
    Mutation: {
        createUser: async (parent, args, context) => {
            const user = await User.create(args);
        
            if (!user) {
              throw new AuthenticationError("User failed to create new user")
            }
            const token = signToken(user);
            return { token, user };
        },
        login: async (parent, args, context) => {
            const user = await User.findOne({email: args.email});
            if (!user) {
                throw new AuthenticationError("Can't find this user")
            }

            const correctPw = await user.isCorrectPassword(args.password);

            if (!correctPw) {
                throw new AuthenticationError("Wrong username or password!")
            }
            const token = signToken(user);
            return { token, user}
        },
        saveBook: async (parent, args, context) => {
            console.log(context.user);
            try {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: args } }, //$push should also work
                    { new: true, runValidators: true }
                );
                return updatedUser;
            } catch (err) {
                console.log(err);
                return err; 
            }
        },
        deleteBook: async (parent, args, context) => {
            const updatedUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId: args.bookId } } },
                { new: true }
              );
              if (!updatedUser) {
                throw new AuthenticationError("Couldn't find user with this id!");
              }
              return updatedUser;
        },

    },
}

module.exports = resolvers;
