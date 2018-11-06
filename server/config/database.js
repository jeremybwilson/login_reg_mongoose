const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const reg = new RegExp('\\.js$', 'i');

const modelsPath = path.resolve('server', 'models');

//mongodb connection
mongoose.connect('mongodb://localhost:27017/login_registration_test', { useNewUrlParser: true });
mongoose.connection.on('connected', () => console.log('MongoDB connected'));

fs.readdirSync(modelsPath).forEach(file => {
    if(reg.test(file)){
        require(path.join(modelsPath, file));
    }
});