//get express from packages
const express = require('express')
//adds GraphQL(express)
const expressGraphQL = require('express-graphql').graphqlHTTP
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull
} = require('graphql')
//creates an express application. The express() function is a
//top-level function exported by the express module
const app = express()

//authors / books represents a data base
const authors = [
    { id: 1, name: 'J. K. Rowling' },
    { id: 2, name: 'J. R. R. Tolkien' },
    { id: 3, name: 'Brent Weeks' }
]

const books = [
    { id: 1, name: 'Harry Potter and the Chamber of Secrets', authorId: 1 },
    { id: 2, name: 'Harry Potter and the Prisoner of Azkaban', authorId: 1 },
    { id: 3, name: 'Harry Potter and the Goblet of Fire', authorId: 1 },
    { id: 4, name: 'The Fellowship of the Ring', authorId: 2 },
    { id: 5, name: 'The Two Towers', authorId: 2 },
    { id: 6, name: 'The Return of the King', authorId: 2 },
    { id: 7, name: 'The Way of Shadows', authorId: 3 },
    { id: 8, name: 'Beyond the Shadows', authorId: 3 }
]

//defines BookType which is a custom object
//object contains name,description,fields
const BookType = new GraphQLObjectType({
    name: 'Book',
    description: 'This represents a book written by an author',
    //fields returns a function, not an object because BookType references
    //AuthorType and vice-versa, this way everything can get defined before
    //it is called
    fields: () => ({
        //wrap GraphQLInt with GraphQLNonNull so it always returns an int
        //dont need to supply resolve for id because the object already has
        //an id property it will pull the id property directly from the object
        //similar for name and authorId
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        authorId: { type: GraphQLNonNull(GraphQLInt) },
        author: {
            //another custom object to get author data inside book
            type: AuthorType,
            //book parameter is the parent property so that author
            //is inside BookType
            resolve: (book) => {
                return authors.find(author => author.id === book.authorId)
            }
        }
    })
})

//custom object similar to BookType
//this gives us the ability to query information bassed on the author
//if this was a REST api this would take muliple querys to get the author 
//data and it would return data that we might not want such as id, authorId
const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description: 'This represents an author of a book',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        books: {
            type: GraphQLList(BookType),
            resolve: (author) => {
                return books.filter(book => book.authorId === author.id)
            }
        }
    })
})



const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    //top level, this will show in documentation
    description: 'Root Query',
    //function that returns the fields (object)
    //each field needs type, description, and resolve
    fields: () => ({

        books: {
            type: new GraphQLList(BookType),
            description: "List of Books",
            //resolve tells graphql where to get the information from
            //resolve(parent, args)
            //if there was a database you would query it here
            resolve: () => books
        },
        book: {
            type: BookType,
            description: "A single book",
            args: {
                id: { type: GraphQLInt }
            },
            //when querying book it needs the argument which is id
            resolve: (parent, args) => books.find(book => book.id === args.id)
        },

        authors: {
            type: new GraphQLList(AuthorType),
            description: "List of Authors",
            resolve: () => authors
        },
        author: {
            type: AuthorType,
            description: "A single author",
            args: {
                id: { type: GraphQLInt }
            },
            resolve: (parent, args) => authors.find(author => author.id === args.id)
        }
    })
})

const RootMutaionType = new GraphQLObjectType({
    name: 'Mutation',
    description: "Root Mutation",
    fields: () => ({
        addBook: {
            type: BookType,
            description: "add a book",
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                authorId: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: (parent, args) => {
                //If there was a database this id would be automaticaly generated
                //create a new book
                const book = {
                    id: books.length + 1,
                    name: args.name,
                    authorId: args.authorId
                }
                //add new book to array of books
                books.push(book)
                //returns book, the new book will appear in graphql untell the
                //server restarts because data is not being stored on a database
                return book
            }
        },
        //very similar to addBook, author does not have an authorId
        addAuthor: {
            type: AuthorType,
            description: "add an Author",
            args: {
                name: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: (parent, args) => {
                const author = {
                    id: authors.length + 1,
                    name: args.name,
                }
                authors.push(author)
                return author
            }
        }
    })
})

//create a GraphQLSchema
const schema = new GraphQLSchema({
    //define query section (getting data)
    query: RootQueryType,
    //mutation is graphqls version of POST, PUT, DELEATE (REST api sever)
    mutation: RootMutaionType

})

//add root for application
//this code runs when we go to localhost:5000/graphql
app.use('/graphql', expressGraphQL({
    //defines the functionality available to the client applications
    //that connect to it
    schema: schema,
    //this gives us the UI to access graphql server
    graphiql: true
}))

//Binds and listens for connections on the specified host and port. This method
// is identical to Node’s http.Server.listen().
app.listen(5000, () => console.log('Server Running'))