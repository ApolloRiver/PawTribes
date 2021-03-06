module.exports = function (nanorpc) {
  var express = require('express');

  var apicache = require('apicache');
  let cache = apicache.middleware

  var router = express.Router();
  var Account = require('../models/account');

  router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
  });

  router.use('/statistics', require('./api/statistics'));
  router.use('/representatives', require('./api/accounts'));
  router.use('/accounts', require('./api/accounts'));
  router.use('/blocks', require('./api/blocks'));
  router.use('/confirmation', require('./api/confirmation'));
  router.use('/node', require('./api/node'));
  router.use('/general', require('./api/general'));
  router.use('/network', require('./api/network'));
  router.use('/ledger', require('./api/ledger'));
  router.use('/telemetry', require('./api/telemetry'));

  router.get('/', function (req, res, next) {
    res.render('api/index', {
      loggedin: req.isAuthenticated(),
      title: 'API'
    });
  });

  router.get('/blockcount', cache('1 minute'), function (req, res) {
    res.json({
      count: nanorpc.getBlockcount()
    });
  });

  router.post('/editAccount', ensureAuthenticated, function (req, res) {    
    Account.findOne({
        'account': req.body.account
      })
      .populate('owner')
      .exec(function (err, account) {
        if (err || !account) {
          // Not found
          res.status(404).end();
          return;
        }

        if (account.owner._id.toString() != req.user._id.toString()) {
          // Forbidden
          res.status(403).end();
          return;
        }

        var output = {};

        account.alias = req.body.account_alias;
        account.description = req.body.account_description;
        account.website = req.body.account_website;

        if(!account.server){
          account.server = {}
        }

        account.server.type = req.body.server_type;
        account.server.cpu = req.body.server_cpu;
        account.server.ram = req.body.server_ram;
        account.donation = req.body.donation;
        account.closing = req.body.closing;

        account.save(function (err) {
          if (err) {
            output.status = 'error';
            output.msg = 'Error!';
          } else {
            output.status = 'success';
            output.msg = 'Success!';
          }
          res.json(output);
        });
      });
  });

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      next();
      return;
    }

    req.session.returnTo = req.path;
    res.redirect('/auth/login');
  };

  return router;

}