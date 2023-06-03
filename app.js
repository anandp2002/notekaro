require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const md5 = require("md5")
const _ = require("lodash")

const app = express()

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true })

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})
const User = new mongoose.model("User", userSchema)


const itemsSchema = {
    name: String
}
const Item = mongoose.model("Item", itemsSchema)


const listSchema = {
    name: String,
    items: [itemsSchema]
}
const List = mongoose.model("List", listSchema)


const item1 = new Item({
    name: "Welcome to your todo List"
})
const item2 = new Item({
    name: "Hit the + button to add a new item"
})
const item3 = new Item({
    name: "<--Hit this to delete an item"
})
const defaultItems = [item1, item2, item3]


app.use(express.static("public"))
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({ extended: true }))


app.get("/", function (req, res) {
    res.render("home")
})


app.get("/register", function (req, res) {
    res.render("register")
})


app.post("/register", function (req, res) {
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })
    newUser.save().then(function () {
        let username = req.body.username
        res.redirect(`/${username}`)
    }).catch(function (err) {
        console.log("Error in reg", err)
    })
})


app.post("/login", function (req, res) {
    const username = req.body.username
    const password = md5(req.body.password)

    User.findOne({ email: username }).exec().then(function (foundUser) {
        if (foundUser.password === password) {
            let username = req.body.username
            res.redirect(`/${username}`)
        }
    }).catch(function (err) {
        console.log(err)
    })
})


app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName)

    List.findOne({ name: customListName }).exec().then(function (foundList) {
        if (!foundList) {
            //create a new list

            const list = new List({
                name: customListName,
                items: defaultItems
            })
            list.save()
            res.redirect("/" + customListName)
        } else {
            //show existing list
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });

        }
    })
})



app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list

    const item = new Item({
        name: itemName
    })

    List.findOne({ name: listName }).exec().then(function (foundList) {
        foundList.items.push(item)
        foundList.save()
        res.redirect("/" + listName)
    })
});


app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox
    const listName = req.body.listName

    List.updateOne(
        { name: listName }, // Find the document based on the name field
        { $pull: { items: { _id: checkedItemId } } } // Remove the item from the items array using $pull
    )
        .then(() => {
            res.redirect("/" + listName); // Redirect to a specific route, possibly the updated list
        })
        .catch((error) => {
            console.error(error);
        });
})


app.listen(3000, function () {
    console.log("Server startde on port 3000")
})