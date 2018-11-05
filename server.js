const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const bcrypt = require('bcryptjs');
const parser = require('body-parser');
const color = require('colors');
const mongoose = require('mongoose');
const path = require('path');
const validator = require('validator');
const {Schema} = mongoose;

const saltRounds = 10;
const port = process.env.PORT || 8001;
// invoke express and store the result in the variable app
const app = express();

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

//mongodb connection
mongoose.connect('mongodb://localhost:27017/login_registration_test', { useNewUrlParser: true });
mongoose.connection.on('connected', () => console.log('MongoDB connected'));

//schemas
const UserSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: [true, 'First name is required'],
        minlength: [3, 'First name must be at least three characters'],
        trim: true
    },
    last_name: {
        type: String,
        required: [true, 'Last name is required'],
        minlength: [3, 'Last name must be at least three characters'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please enter an email address'],
        unique: true,
        validate: {
            validator(email) {
                return validator.isEmail(email);
            },
            message: "Please enter a valid email"
        }
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlegth: 8,
        validate: {
            validator: (value) => {
                return /^(?=.*[a-z])(?=[A-Z])(?=.*\d)(?=.*[$@$!#%*?&])[A-Za-z\d$@$!#%*?&]{8,32}/.test(value);
            },
        message: "Password requirements: at least one number, uppercase and special character and be at least 8 characters long"
        }
    },
    date_of_birth: {
        type: Date,
        required: [true, 'Please enter date of birth']
    }
}, {timestamps: true});

// Hash Password
// we use this hash a password only if it is a new password of if it has been changed.  
// if it is already a hashed pw, don't hash => we ask 'has this field been modified?' 
// attached to the instance created from the model, so it is called in the context of an instance, 
// therefore we use 'this' and not an es6 function
UserSchema.pre('save', function(next){
    if(!this.isModified('password')){
        return next();
    }
    bcrypt.hash(this.password, saltRounds)
    .then(hashed_password => {
        this.password = hashed_password;
        next();
    })
    .catch(next);
})

// to validate a password, use the UserSchema and statics.  What this does is like a prototype for the model
// so we call the 'statics' object and create a new method for it with the name we assign.
// statics is the static information to a Class
// we will return a boolean value to the handle elsewhere => separation of concerns
UserSchema.statics.validatePassword = function(password_from_form, stored_hashed_password){
    return bcrypt.compare(password_from_form, stored_hashed_password);
};

const User = mongoose.model('User', UserSchema);
mongoose.model('User', UserSchema); // We are setting this Schema in our Models as 'User'

app.listen(port, () => console.log(`Express server listening on port ${port}`));

//routing
app.get('/', (request, response) => {
    console.log(`getting the index route`)
    response.render('index', {title: 'Login'} );
});

app.get('/user/new', (request, response) => {
    console.log(`getting the user registration route`)
    response.render('new', {title: 'New User Registration'} );
});

// process new user registration
app.post('/new', (request, response) => {
    console.log(`posting to the 'new' user route`)
    console.log('request.body', request.body)
    User.create(request.body)
        .then(user => {
            // render dashboard
            response.redirect(`/new/${user._id}`)
        })
        .catch(error => {
            for(let key in error.errors){
                console.log(error.errors[key].message)
                request.flash('user_registration_error', error.errors[key].message)
            }
            response.render('new', {error, title: '' });
        });
});

// view an individual user page
app.get('/user/:_id', (request, response) => {
    const which = request.params._id;
    console.log(`getting the view an individual user route`);
    User.findById(which)
        .then(user => {
            console.log('request.body', request.body)
            response.render('view', {user, title: 'View User'} );
        })
        .catch(error => {
            console.log('something went wrong viewing the individual user route');
            for (let key in error.errors) {
                request.flash('view_user_error', error.errors[key].message)
                console.log(error.errors[key].message);
            }
            response.redirect('/');
        });
});

// login route
app.post('/login', (request, response) => {
    console.log(`posting to the user login route`);
    User.findOne({ email: request.body.email })
        .then(userInfo => {
            if(!userInfo){
                throw new Error();
            }
            console.log(`successfully matched a user in the database`);
            console.log(`user submitted password: ${request.body.password}`);
            console.log(`database stored password: ${userInfo.password}`);
            return User.validatePassword(request.body.password, userInfo.password, userInfo._id)
                .then(user => {
                    console.log(`user information available here: ${userInfo._id}, ${request.body.email}`);
                    // add session id
                    request.session.user_id = userInfo._id;
                    request.session.email = userInfo.email;
                    request.session.isLoggedIn = true;
                    // response.render('view', {user, title: 'View User'} );
                    // render dashboard
                    console.log('request.session info stored:', request.session);
                    response.redirect(`/user/${request.session.user_id}`)
                })
    })
    .catch(error => {
        for(let key in error.errors){
            console.log(error.errors[key].message)
            request.flash('user_login_error', error.errors[key].message)
        }
        // re-render the form so user does not need to re-enter all the information.
        // If redirecting, they would have to type everything again
        response.render('index', {error: 'Email and password combination does not exist', title: 'Login'})
    });
});

// edit individual user route
// app.get('/user/edit/:_id, (request, response) => {
//     const which = request.params.id;
//     response.render('edit', {title: 'View User'} );
// });

// logout route
app.get('/logout', (request, response) => {
    request.session.user_id = null;
    response.redirect('/');
});


// catch 404 and forward to error handler
app.use((request, response, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, request, response, next) => {
    // set locals, only providing error in development
    response.locals.message = err.message;
    response.locals.error = request.app.get('env') === 'development' ? err : {};
    response.status(err.status || 500);
    // render the error page
    response.render('error', {title: 'Error page'});
  });

// app.listen(port, () => console.log(`Express server listening on port ${port}`));    // ES6 way