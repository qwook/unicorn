
# Unicorn
This is my attempt at designing and developing a full-stack web framework. Unicorn is an embodiment of what I think a good web framework should be.  
  
I believe that a good web framework should have a fast build-time during development, is close to vanilla languages as possible, and makes sense to read.  

# Motives
Below is notes that I have taken for what I believe is a "unicorn" web framework. It is a roadmap for what I plan to do.

**Please note that this framework is currently in development and not ready for production.**
  
## Rules
1. Don't be verbose.  
2. Everything must be modular.  
3. Be close to vanilla as possible.  

## Back End
Can plug in any database you want!  
Routers should be built in.  
Model should update live -> (mongo-oplog)  

## Front End
Templates should look like HTML!  
Copy and pasting bootstrap components should instantly work!  
Can mix in Javascript.  
Must have if, while, and for statements.  
Must not be too verbose.  
  
Meteor's templating engine is in HTML, and it has if, while, and for statements.  
However, it does not allow for mixing in javascript! Doing equations or comparisons in the if statements doesn't work. You can do that using template helpers but doing so causes the code to be extremely verbose.  
    
Jade's template isn't verbose and look extremely pretty! However, it is extremely far from vanilla HTML.  
  
React can do everything, however if, while, and for statements are all so verbose! It would be nice to be able to use React for templating however with special syntax to use these keywords.  

Underscore.js's templating seems like a great compromise due to it's ability to do inline-logic and it's closeness to vanilla HTML. Unfortunately, it seems like too large of a library. We are using Dot.JS instead with similar syntax.

## Testing
Should come with testing API.
Allows for testing with any unit testing frameworks like Mocha.
