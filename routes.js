const {registerSchema, loginSchema, foodItemSchema, passwordChangeSchema, orderSchema} = require('./schema');
const {insertDoc, fetchAll, fetchByID, deleteDoc, updateDoc} = require('./db-util');
const multer = require('multer')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, req.body.name+'.jpg')
    }
  })
   
var upload = multer({ storage: storage })


module.exports = (app, db) => {

    app.post('/register', (req, res) => {
        const validation = registerSchema.validate(req.body);
        if (validation.error !== null){
            res.status(400).send(validation.error.details[0].message);
        } else {
            fetchByID(db, 'users', req.body.username)
            .then((x) => {
                res.status(400).send('User already exists')
            })
            .catch(x => {
                insertDoc(db,'users', {...req.body, customer: true}, req.body.username)
                .then(x => {
                    res.send(true)
                })
                .catch(x => {
                    res.status(500).send("Error at server side")
                })
            })
        }
    })

    app.post('/login', (req, res) => {
        const validation = loginSchema.validate(req.body);
        if (validation.error !== null){
            res.status(400).send(validation.error.details[0].message);
        } else {
            fetchByID(db, 'users', req.body.username)
            .then((x) => {
                if (x.password !== req.body.password){
                    res.status(400).send('The username and password combination do not match')
                } else {
                    res.cookie('sessionToken', req.body.username, {expire: new Date()+9999})
                    res.send(x)
                }
            })
            .catch(x => {
                res.status(400).send('No account exists with given username')
            })
        }
    })

    app.post('/insertFoodItem', upload.single('foodImage'), (req, res) => {
        const data = JSON.parse(JSON.stringify(req.body))
        const validation = foodItemSchema.validate(data);
        if (validation.error !== null){
            res.status(400).send(validation.error.details[0].message);
        } else {
            fetchByID(db,'menu',data.name)
            .then(x => {
                res.status(400).send('Menu item already exists')
            })
            .catch(x => {
                insertDoc(db,'menu', data, data.name)
                .then(x => {
                    res.send('success')
                })
                .catch(x => {
                    res.status(500).send('Server was not able to insert menu item')
                })
            })
        }
    })

    app.post('/getMenu', (req,res) => {
        fetchAll(db, 'menu')
        .then(x => {
            res.send(x)
        })
        .catch(x => {
            res.status(500).send('The server was not able to fetch the menu')
        })
    })

    app.post('/deleteFoodItem', (req,res) => {
        if (req.body.id !== null){
            fetchByID(db,'menu',req.body.id)
            .then(x => {
                deleteDoc(db, 'menu', req.body.id)
                .then(x => {
                    res.send('success')
                })
                .catch(x => {
                    res.status(500).send('Server was not able to delete')
                })
            })
            .catch(x => {
                res.status(400).send('No such food item')
            })
        } else {
            res.status(400).send('You have not provided the server with food name')
        }
    })

    app.post('/updateFoodItem', (req,res) => {
        const validation = foodItemSchema.validate(req.body);
        if (validation.error !== null){
            res.status(400).send(validation.error.details[0].message);
        } else {
            fetchByID(db, 'menu', req.body.name)
            .then(x => {
                updateDoc(db, 'menu',req.body.name,req.body)
                .then(x => {
                    res.send('success');
                })
                .catch(x => {
                    res.status(500).send('Food was not able to be updated')
                })
            })
            .catch(x => {
                res.status(500).send('No such food item')
            })
        }
    })

    app.post('/passwordChange', (req, res) => {
        const validation = passwordChangeSchema.validate(req.body);
        if (validation.error !== null){
            res.status(400).send(validation.error.details[0].message);
        } else {
            fetchByID(db, 'users', req.body.username)
            .then(x => {
                if (x.password === req.body.currentPassword) {
                    updateDoc(db, 'users',req.body.username,{password: req.body.newPassword})
                    .then(x => {
                        res.send('success');
                    })
                    .catch(x => {
                        res.status(500).send('Server was not able to change password')
                    })
                } else {
                    res.status(400).send('Incorrect password provided');
                }
            })
            .catch(x => {
                res.status(400).send('No such user')
            })
        }
    })

    app.post('/insertOrder', (req, res) => {
        const validation = orderSchema.validate(req.body);
        if (validation.error !== null){
            res.status(400).send(validation.error.details[0].message);
        } else {
            fetchByID(db,'users',req.body.username)
            .then(user => {
                fetchAll(db, 'menu')
                .then(menu => {
                    const menuArray = [];
                    menu.forEach(food => {
                        menuArray.push(food.name)
                    })
                    const result = req.body.foodList.every(val => menuArray.includes(val));
                    if (result == false){
                        res.status(400).send('Invalid food items selected')
                    } else {
                        let totalPrice = 0;
                        const orderCount = {}
                        const foodOrdered = [];                        
                        req.body.foodList.map(food => {
                            if (orderCount[food] === undefined){
                                orderCount[food] = 1 
                            } else {
                                orderCount[food] += 1 
                            }
                        })
                        Object.keys(orderCount).forEach(x => {
                            let price = menu.filter(y => y.name == x)[0].price;
                            foodOrdered.push({
                                name: x,
                                quantity: orderCount[x],
                                price_per_unit: price
                            })
                            totalPrice += orderCount[x]*price;
                        })
                        var today = new Date();
                        var dd = today.getDate();
                        var mm = today.getMonth()+1; 
                        var yyyy = today.getFullYear();
                        const order = {
                            id: Date.now(),
                            food: foodOrdered,
                            address: req.body.address,
                            totalPrice: totalPrice,
                            dateOfOrder: `${dd}/${mm}/${yyyy}`
                        };
                        let data = [];
                        if (user.orders === undefined){
                            data = [order]
                        } else {
                            data = [...user.orders, order]
                        }
                        updateDoc(db, 'users', req.body.username, {orders: data})
                        .then(x => {
                            res.send(order)
                        })
                        .catch(x => {
                            res.status(500).send('Server was not able to take order')
                        })
                    }
                })
                .catch(x => {
                    res.status(500).send('Server was not able to retrieve menu')
                })
            })
            .catch(x => {
                res.status(400).send('No such user')
            })
        }
    })

    app.post('/getOrders', (req, res) => {
        if (req.body.username !== null){
            fetchByID(db,'users',req.body.username)
            .then(x => {
                res.send(x.orders)
            })
            .catch(x => {
                res.status(400).send('No such user')
            })
        } else {
            res.status(400).send('You have not provided the server with username')
        }
    })

    app.post('/getAllUsers', (req,res) => {
        fetchAll(db, 'users')
        .then(x => {
            res.send(x)
        })
        .catch(x => {
            res.status(500).send('The server was not able to fetch the menu')
        })
    })

}