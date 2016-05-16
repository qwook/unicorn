# Rules
Don't be verbose.
Everything must be modular.
Be close to vanilla as possible.

# Back End
Can plug in any database you want!
Routers should be built in.
Model should update live -> (mongo-oplog)

# Front End
Templates should look like HTML!
Copy and pasting bootstrap components should instantly work!
Can mix in Javascript.
Must have if, while, and for statements.
Must not be too verbose.

Meteor's templating engine is in HTML, and it has if, while, and for statements.
However, it does not allow for mixing in javascript! Doing equations or comparisons in the if statements doesn't work. You can do that using template helpers but doing so causes the code to be extremely verbose.
  
Jade's template isn't verbose and look extremely pretty! However, it is extremely far from vanilla HTML.
  
React can do everything, however if, while, and for statements are all so verbose! It would be nice to be able to use React for templating however with special syntax to use these keywords.
  
Proposal for unicorn templating engine:
```
<div>
  <if (test == 2)>
    <for (i = 0; i < 10; i++)>
    </for>

    <while (true)>
    </while>
  </if>
</div>
```

# Testing
Comes with testing API.
Allows for testing with any unit testing frameworks like Mocha.
