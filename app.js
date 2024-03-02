require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const md5 = require('md5');
const _ = require('lodash');

const app = express();

mongoose
  .connect(
    'mongodb+srv://anandpamegoze:Chp8GP2Pz4XbyTan@hackathoncluster.0a9fy9o.mongodb.net/?retryWrites=true&w=majority&appName=hackathoncluster',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true, // Use the new server discovery and monitoring engine
    }
  )
  .then(() => console.log('MongoDB connected...'))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = new mongoose.model('User', userSchema);

const itemsSchema = {
  name: String,
  description: String, // Added description field
};
const Item = mongoose.model('Item', itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model('List', listSchema);

const item1 = new Item({
  name: 'Welcome to your todo List',
  description: 'This is a welcome note.', // Added description
});
const item2 = new Item({
  name: 'Hit the + button to add a new item',
  description: 'This is a guide on how to add a new item.', // Added description
});
const item3 = new Item({
  name: '<--Hit this to delete an item',
  description: 'This is a guide on how to delete an item.', // Added description
});
const defaultItems = [item1, item2, item3];

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/register', function (req, res) {
  res.render('register');
});

app.post('/register', function (req, res) {
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password),
  });
  newUser
    .save()
    .then(function () {
      let username = req.body.username;
      res.redirect(`/${username}`);
    })
    .catch(function (err) {
      console.log('Error in reg', err);
    });
});

app.post('/login', function (req, res) {
  const username = req.body.username;
  const password = md5(req.body.password);

  User.findOne({ email: username })
    .exec()
    .then(function (foundUser) {
      if (foundUser.password === password) {
        let username = req.body.username;
        res.redirect(`/${username}`);
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .exec()
    .then(function (foundList) {
      if (!foundList) {
        //create a new list

        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        //show existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    });
});

app.post('/', function (req, res) {
  const itemName = req.body.newItem;
  const itemDescription = req.body.newItemDescription; // Added this line
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
    description: itemDescription, // Added this line
  });

  List.findOne({ name: listName })
    .exec()
    .then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
});

app.post('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  const newItemName = req.body.newItem;
  const newItemDescription = req.body.newItemDescription; // Assuming you have a description field

  // Create a new item with the provided name and description
  const newItem = new Item({
    name: newItemName,
    description: newItemDescription, // Make sure your Item schema includes a description field
  });

  // Find the list by name and add the new item to it
  List.findOne({ name: customListName })
    .exec()
    .then(function (foundList) {
      if (!foundList) {
        // If the list does not exist, create a new list with the default items and the new item
        const list = new List({
          name: customListName,
          items: [...defaultItems, newItem], // Add the new item to the default items
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        // If the list exists, add the new item to it
        foundList.items.push(newItem);
        foundList.save();
        res.redirect('/' + customListName);
      }
    })
    .catch(function (err) {
      console.log(err);
      res.status(500).send('An error occurred while adding the item.');
    });
});

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  List.updateOne(
    { name: listName },
    { $pull: { items: { _id: checkedItemId } } }
  )
    .then(() => {
      res.redirect('/' + listName);
    })
    .catch((error) => {
      console.error(error);
    });
});

app.listen(3000, function () {
  console.log('Server started on port 3000');
});
