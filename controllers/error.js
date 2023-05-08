exports.get404page = (req, res, next) => {
    res.status(404).render('404', {pageTitle: 'Page not found', path: ''})
}

exports.get500page = (req, res, next) => {
    res.status(500).render('500', {pageTitle: 'An error as occured', path: '/500'})
}

