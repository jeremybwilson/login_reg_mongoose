const express = require('express'),
    session = require('express-session'),
    flash = require('express-flash'),
    parser = require('body-parser'),
    color = require('colors'),
    path = require('path'),

    port = process.env.PORT || 8001,
    // invoke express and store the result in the variable app
    app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));
app.set('views', path.join(__dirname, 'views'));

app.use(parser.urlencoded({ extended: true }));
app.use(parser.json());
app.use(flash());
app.use(session({
    secret:'superSekretKitteh',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, 
        maxAge: 60000
    }
}));

require('./server/config/database');
require('./server/config/routes')(app);

app.listen(port, () => console.log(`Express server listening on port ${port}`));
// app.listen(port, () => console.log(`Express server listening on port ${port}`));    // ES6 way