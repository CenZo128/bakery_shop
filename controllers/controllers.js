class HomeController {
    // static index(req,res){
    //     res.render('index')
    // }
    // static login(req,res){
    //     res.render('login')
    // }
    // static register(req,res){
    //     res.render('register')
    // }

    static home(req, res){
        Book.findAll().then(books => {
            res.render('home.ejs', {books, username: req.session.username})
        })
    }

    static findBooksCustomer(req, res){
        Book.findAll({})
        .then(data => {
            res.render('breadCustomer.ejs', {data})
        })
        .catch(err => {
            console.log(err)
        })
    }

    static loginForm(req, res) {
        res.render('login')
    }

    static login(req, res) {
        let fields = req.body
        let foundData = null
        Customer.findOne({
            where: {
                username: fields.username
            }
        })
        .then(data => {
            if(data) {
                foundData = data
                return checkPassword(fields.password, data.password)
            }
        })
        .then(success => {
            if(success) {
                req.session.userId = foundData.id
                req.session.username = foundData.username
                res.redirect('/')
            } else {
                res.send('Invalid Username/Password')
            }
        })
        .catch(err => {
            res.send(err)
        })
    }

    static registerForm(req, res){
        res.render('register')
    }

    static register(req, res){
        let newCustomer = new Customer(req.body)
        newCustomer.validate().then(() => {
            return hashPassword(req.body.password)
        })
        .then(hash => {
            newCustomer.setDataValue('password', hash)
            return newCustomer.save()
        })
        .then(data => {
            req.session.userId = data.id
            req.session.username = data.username
            res.redirect('/')
        })
        .catch(err => {
            if(err.name === 'SequelizeValidationError') {
                let errorMsg = err.errors.map((value, index) => {
                    return value.message
                })
                res.send(errorMsg)
            } else {
                res.send(err)
            }
        })
    }

    static logout(req, res) {
        req.session.destroy((err) => {
            if(err) {
                res.send(err)
            } else {
                res.redirect('/')
            }
        })
    }

    static bookDetailCustomerForm(req, res){
        const id = Number(req.params.id)

        Book.findByPk(id)
        .then(data => {
            res.render('detailBreadCustomer.ejs', {data})
        })
        .catch(err => {
            res.send('err')
        })
    }

    static buyForm(req, res) {
        const id = Number(req.params.id)

        Bread.findByPk(id)
        .then(book => {
            if(book) {
                res.render('buy', {book, username: req.session.username})
            } else {
                res.send('Bread not found')
            }
        })
        .catch(err => {
            res.send(err)
        })
    }

    static buy(req, res) {
        const id = Number(req.params.id)
        let foundBook = null
        Bread.findByPk(id)
        .then(book => {
            if(book) {
                foundBook = book
                return Transaction.create({
                    CustomerId: req.session.userId,
                    BookId: id,
                    amount: Number(req.body.amount)
                })
            }
        }).then(transaction => {
            if(foundBread) {
                req.session.lastTransactionId = transaction.id
                res.redirect('/buysuccess')
            } else {
                res.send('Bread not found')
            }
        })
        .catch(err => {
            res.send(err)
        })
    }

    static buySuccess(req, res) {
        const transactionId = req.session.lastTransactionId
        Transaction.findOne({where: {id: transactionId}, include: [Bread, Customer] }).then(transaction => {
            console.log(transaction)
            if(transaction) {
                res.render('buysuccess', {transaction, username: req.session.username})
            } else {
                res.redirect('/')
            }
        }).catch(err => {
            res.send(err)
        })
    }

    // ADMIN

    static findBreadAdmin(req, res){
        Bread.findAll({})
        .then(data => {
            res.render('breadAdminList.ejs', {data, username: req.session.adminUsername})
        })
        .catch(err => {
            console.log(err)
        })
    }

    static addBreadAdminForm(req, res){
        res.render('addBreadAdminForm.ejs', {username: req.session.adminUsername})
    }

    static addBreadAdmin(req, res){
        req.body.createdAt = new Date()
        req.body.updateAt = new Date()

        const insertData = req.body
        if(req.file) {
            insertData.image = '/' + req.file.destination + req.file.filename
        }
        Bread.create(insertData)
        .then(data => {
            res.redirect('/breadAdmin')
        })
        .catch(err => {
            res.send(err)
        })
    }

    static editBreadAdminForm(req, res){

        const id = Number(req.params.id)

        Bread.findByPk(id)
        .then(data => {
            res.render('editBreadAdmin.ejs', {data, username: req.session.adminUsername})
        })
        .catch(err => {
            res.send('err')
        })
    }

    static editBreadAdmin(req, res){
        const id = req.params.id
        const insertData = req.body
        if(req.file) {
            insertData.image = '/' + req.file.destination + req.file.filename
        }
        Bread.update(insertData, {where : {id}})
        .then(() => {
            res.redirect('/breadAdmin')
        })
        .catch(err => {
            res.send('err')
        })
    }

    static deleteBreadAdmin(req, res){
        const id = req.params.id

        Bread.destroy({where : {id}})
        .then(data => {
            res.redirect('/breadAdmin')
        })
        .catch(err => {
            res.send(err)
        })
    }

    static transactions(req, res){
        Transaction.findAll({order: [['date', 'asc']], include: [Bread, Customer]})
        .then(data => {
            res.render('transactionList.ejs', {data, username: req.session.adminUsername})
        })
        .catch(err => {
            console.log(err)
        })
    }

    static showLoginAdmin(req, res) {
        res.render('loginAdmin')
    }

    static loginAdmin(req, res) {
        let fields = req.body
        let foundData = null
        Admin.findOne({
            where: {
                username: fields.username
            }
        })
        .then(data => {
            if(data) {
                foundData = data
                return checkPassword(fields.password, data.password)
            }
        })
        .then(success => {
            if(success) {
                req.session.adminId = foundData.id
                req.session.adminUsername = foundData.username
                res.redirect('/breadAdmin')
            } else {
                res.send('Invalid Username/Password')
            }
        })
        .catch(err => {
            res.send(err)
        })
    }

    static logoutAdmin(req, res) {
        req.session.destroy((err) => {
            if(err) {
                res.send(err)
            } else {
                res.redirect('/admin/login')
            }
        })
    }
}

module.exports = HomeController
