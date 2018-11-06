const User = require('mongoose').model('User');

module.exports = {
    // index route
    index(request, response){
        console.log(`getting the index route`)
        if(request.session.isLoggedIn === true){
            response.redirect(`/user/${request.session.user_id}`);
        } else {
            response.render('index', {title: 'Login'} );
        }
    },

    // create new user route (form)
    new(request, response){
        console.log(`getting the user registration route`);
        if(request.session.isLoggedIn === true){
            response.redirect(`/user/${request.session.user_id}`);
        } else {
            response.render('new', {title: 'New User Registration'} );
        }
    },

    // process new user registration (post) route
    create(request, response){
        console.log(`posting to the 'new' user route`)
        console.log('request.body', request.body)
        User.create(request.body)
            .then(userInfo => {
                // assign session variables
                request.session.user_id = userInfo._id;
                request.session.email = userInfo.email;
                request.session.name = userInfo.first_name;
                request.session.isLoggedIn = true;
                // render dashboard
                response.redirect(`/user/${user._id}`)
            })
            .catch(error => {
                for(let key in error.errors){
                    console.log(error.errors[key].message)
                    request.flash('user_registration_error', error.errors[key].message)
                }
                response.render('new', {error, title: 'New User Registration' });
            });
    },

    // view an individual user route
    show(request, response){
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
    },

    // edit individual user route
    edit(request, response){
        console.log(`getting the edit user route`);

        console.log(`request.body info: ${request.body}`);
        const which = request.params._id;
        User.findById({_id:which})
            .then(user => {
                console.log(`successfully matched a user`);
                response.render('edit', { user, title: 'Edit User'})
            })
            .catch(error => {
                console.log('something went wrong viewing the user edit route');
                for (let key in error.errors) {
                    request.flash('edit_user_error', error.errors[key].message)
                    console.log(error.errors[key].message);
                }
                response.redirect(`/user/edit/${which}`);
            })
    },

    // update user route
    update(request, response){
        console.log(`getting the edit user route`);
        const which = request.params._id;
        User.findByIdAndUpdate(which, request.body)
            .then(() => {
                console.log(`successfully matched a user`);
                response.redirect(`/user/${which}`);
            })
            .catch(error => {
                console.log('something went wrong posting user update info');
                for (let key in error.errors) {
                    request.flash('edit_user_error', error.errors[key].message)
                    console.log(error.errors[key].message);
                }
                response.redirect(`/user/${which}/edit`);
            })
    },

    // login post route
    login(request, response){
        console.log(`posting to the user login route`);
        User.findOne({ email: request.body.email })
            .then(userInfo => {
                console.log(`successfully matched a user in the database`);
                return User.validatePassword(request.body.password, userInfo.password)
                    .then((result) => {
                        if(!result){
                            throw new Error();
                        }
                        console.log(`user information available here: ${userInfo._id}, ${request.body.email}`);
                        // assign session variables
                        request.session.user_id = userInfo._id;
                        request.session.email = userInfo.email;
                        request.session.name = userInfo.first_name;
                        request.session.isLoggedIn = true;
                        // render dashboard
                        console.log('request.session info stored:', request.session);
                        response.redirect(`/user/${request.session.user_id}`)
                    })
            })
            .catch(error => {
                console.log('errors at login:', error);
                // for(let key in error.errors){
                //     console.log(error.errors[key].message)
                //     request.flash('user_login_error', error.errors[key].message)
                // }
                // re-render the form so user does not need to re-enter all the information.
                // If redirecting, they would have to type everything again
                response.render('index', { error: 'Email and password combination does not exist', title: 'Login' })
            });
    },

    // logout route
    logout(request, response){
        // request.session.user_id = null;
        request.session.destroy();
        response.redirect('/');
    },

    // delete user route
    destroy(request, response){
        const which = request.params._id;
        User.remove({_id:which})
            .then(() => {
                console.log('deleted successfully')
                response.redirect('/');
            })
            .catch((error) => {
                console.log(error);
                response.redirect('/');
            });
    }
};