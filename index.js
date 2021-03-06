 var express = require('express');
 var app = express();
 var routes = require('./routes');
 var bodyParser = require('body-parser')
 const webpush = require('web-push');
 var MongoClient = require("mongodb");
 var schedule = require('node-schedule');
 var cors = require('cors');

 app.use(cors());
 const vapidKeys = {
     publicKey:
         // 'BFxJHOL11hXZ6FlS27GI9R4idwWeT0R4QDlBeVLzculimGR9UE52iDKUn02-ez8-4ZFl5f2DqO-M19K8J_deYLc',
         'BIY6zwhkwWk68u5Xzh_NYKwEzsEpOLsSSEdxDHLZWaGWEQOvAWpZ8iJJEqJof2y6BnIxNrPFo4v3tGO4wbkyywY',
     privateKey: 'Flu-wiv4hfQy-astZyx9_pykQt_54QpQJWQqm3QoQVw'
 };

 var MONGOLAB_URI = "mongodb://test:test123@ds233452.mlab.com:33452/subscription-datastore";

 const path = require('path');
 const PORT = process.env.PORT || 5000

 //Batch processing
 /*var j = schedule.scheduleJob('* * * * *', function(fireDate){
   console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
   MongoClient.connect(MONGOLAB_URI, function(err, db){
   if(err){
     console.log(err);
   }
   const myAwesomeDB = db.db('subscription-datastore');
   console.log('Inside retrieve DB');
   var cursor = myAwesomeDB.collection('WebPushRequest').find();
   cursor.each(function(err, doc){
     if(doc){
       console.log(doc);
       console.log("data found");
       for(var eid in doc.eids){
        var req = {appid : doc.appid, header: doc.header, category:doc.category, eid : doc.eids[eid], message:doc.message, url:doc.url };
        console.log(req);
      }
     }
   });
 });

 });
 */

 app.get('/ashish', function(req, res) {
     res.send('Hello World');
 })

 app.use(express.static(path.join(__dirname, 'public')));
 app.use(bodyParser.json())
 app.get('/', function(req, res) {
     console.log(__dirname);
     console.log('Inside app.get method');
     res.sendFile('index.html');
     console.log('sharma');
 })

 function savetoMongoDB(body) {


     MongoClient.connect(MONGOLAB_URI, function(err, db) {
         if (err) {
             console.log(err);
         }
         const myAwesomeDB = db.db('subscription-datastore');


         console.log(body.subscription);
         console.log(body.userPreferences);
         var data = body.subscription;
         var userPreferences = body.userPreferences;

         var objectId;
         var subscriptionEndpoint = body.subscription.endpoint;
         myAwesomeDB.collection('Subscription').insertOne(data, function(err, res) {
             if (err) throw err;
             console.log("1 document inserted");
             console.log("object id - ", data._id);
             objectId = data._id;

             console.log("objectId - ", objectId);
             var newData = {
                 ref_id: objectId,
                 endpoint: subscriptionEndpoint,
                 userPreferences: userPreferences
             };
             console.log("new data - ", newData);
             myAwesomeDB.collection('UserPreferences').insertOne(newData, function(err, res) {
                 if (err) throw err;
                 console.log("1 document inserted");
                 console.log("object id - ", data._id);
                 objectId = data._id;
                 db.close();
             });


         });



     });
     // res.send(JSON.stringify({ data: { success: true } }));

 }


 function saveSubscriptionToDatabase(body) {
     savetoMongoDB(body);
     console.log('subscription received5689', body);

 }

 const triggerPushMsg = function(subscription, dataToSend) {
     console.log('Data to send', dataToSend);
     return webpush.sendNotification(subscription, dataToSend)
         .then(function abc() {
             console.log('data successfully sent to push message services');
         })
         .catch((err) => {
             if (err.statusCode === 410) {
                 // return deleteSubscriptionFromDatabase(subscription._id);
             } else {
                 console.log('Subscription is no longer valid: ', err);
             }
         });
 };

 function retrievefromDB() {
     MongoClient.connect(MONGOLAB_URI, function(err, db) {
         if (err) {
             console.log(err);
         }
         const myAwesomeDB = db.db('subscription-datastore');

         console.log('Inside retrieve DB');
         // var cursor  = collection('Subscription').find();

         var cursor = myAwesomeDB.collection('Subscription').find({});
         cursor.each(function(err, doc) {
             if (doc) {
                 console.log("finding data");
                 console.log(doc);
                 triggerPushMsg(doc, 'Test Dataasd');
                 console.log("data found");
             }
         });
         /* myAwesomeDB.collection('Subscription').find({}, function(err, res) {
            if (err) throw err;
            console.log(res);
            console.log('got results');
            db.close();
          });*/
     });
 }

 function retrievefromDBBasedOn(req) {
     MongoClient.connect(MONGOLAB_URI, function(err, db) {
         if (err) {
             console.log(err);
         }
         const myAwesomeDB = db.db('subscription-datastore');

         console.log('Inside retrieve DB');
         console.log(req.category);
         if (req.eid != null) {
             var cursor = myAwesomeDB.collection('EIDMapping').find({
                 "eid": req.eid
             });
             cursor.each(function(err, doc) {
                 if (doc) {
                     console.log(doc.eid);
                     console.log("finding data for eid");
                     console.log(doc.pfgStatCookie);
                     console.log(req.category);
                     var cursor1 = myAwesomeDB.collection('UserPreferences').find({
                         "userPreferences.pfgStatCookie": {
                             "$in": [doc.pfgStatCookie]
                         },
                         "userPreferences.categories": {
                             "$in": [req.category]
                         }
                     });
                     cursor1.each(function(err, doc1) {
                         if (doc1) {
                             console.log("finding data");
                             console.log(doc1.ref_id);
                             var cursor2 = myAwesomeDB.collection('Subscription').find({
                                 "_id": {
                                     "$in": [doc1.ref_id]
                                 }
                             });
                             cursor2.each(function(err, doc2) {
                                 if (doc2) {
                                     console.log("finding data");
                                     console.log("data", doc2);
                                     var newData = {
                                         header: req.header,
                                         message: req.message,
                                         url: req.url,
                                     };
                                     console.log("Sending message :", newData);
                                     console.log("Subscriber data :", doc2);

                                     triggerPushMsg(doc2, JSON.stringify(newData));
                                 }

                             });
                         }

                     });
                 }
             });


         } else {
             //general notifications
             var cursor = myAwesomeDB.collection('UserPreferences').find({
                 "userPreferences.categories": {
                     "$in": [req.category]
                 }
             });
             cursor.each(function(err, doc) {
                 if (doc) {
                     console.log("finding data");
                     console.log(doc.ref_id);
                     var cursor = myAwesomeDB.collection('Subscription').find({
                         "_id": {
                             "$in": [doc.ref_id]
                         }
                     });
                     cursor.each(function(err, doc) {
                         if (doc) {
                             console.log("finding data");
                             console.log("data", doc);
                             var newData = {
                                 header: req.header,
                                 message: req.message,
                                 url: req.url
                             };
                             console.log("Sending message :" + newData);
                             triggerPushMsg(doc, JSON.stringify(newData));
                         }
                     });
                     console.log("data found");
                 }
             });
         }

     });
 }

 function sendNotification(req) {
     webpush.setVapidDetails(
         'mailto:ashishrsharma2@gmail.com',
         vapidKeys.publicKey,
         vapidKeys.privateKey
     );

     var reqbody = req.body;
     console.log(reqbody.appid);

     retrievefromDBBasedOn(reqbody);
 }


 app.post('/api/send-subscription/', function(req, res) {

     webpush.setVapidDetails(
         'mailto:ashishrsharma2@gmail.com',
         vapidKeys.publicKey,
         vapidKeys.privateKey
     );

     retrievefromDB();
     res.setHeader('Content-Type', 'application/json');
     res.send(JSON.stringify({
         data: {
             success: true
         }
     }));
     return 123;
 });

 app.post('/api/send-notification/', function(req, res) {

     webpush.setVapidDetails(
         'mailto:ashishrsharma2@gmail.com',
         vapidKeys.publicKey,
         vapidKeys.privateKey
     );

     var reqbody = req.body;
     // console.log(reqbody.appid);

     retrievefromDBBasedOn(reqbody);
     res.setHeader('Content-Type', 'application/json');
     res.send(JSON.stringify({
         data: {
             success: true
         }
     }));
     return 123;
 });


app.post('/api/update-userpreferences/', function(req, res) {
    var reqbody = req.body;
     console.log(reqbody);
     MongoClient.connect(MONGOLAB_URI, function(err, db) {
         if (err) {
             console.log(err);
         }
const myAwesomeDB = db.db('subscription-datastore');
         console.log("Endpoint from request: ", reqbody.endpoint);
         console.log(" reqbody.pfgStatCookie from request: ", reqbody.pfgStatCookie);

var cursor = myAwesomeDB.collection('UserPreferences').findOneAndUpdate({
    "endpoint": reqbody.endpoint}, {$set: {"userPreferences.pfgStatCookie": reqbody.pfgStatCookie}}, 
    function (err, doc){
                if (err) {
                    console.log(err);
                 }
                 console.log("updated");
             });
});

res.setHeader('Content-Type', 'application/json');
     res.send(JSON.stringify({
         data: {
             success: true
         }
     }));
     return 123;

     
 });
 



 app.post('/api/save-subscription/', function(req, res) {
     console.log('Inside save subscription2');
     saveSubscriptionToDatabase(req.body);

     res.setHeader('Content-Type', 'application/json');
     res.send(JSON.stringify({
         data: {
             success: true
         }
     }));

     // res.send(JSON.stringify({ data: { success: true } }));
     /* return routes.saveSubscriptionToDatabase(req.body)
      .then(function(subscriptionId) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ data: { success: true } }));
      })
      .catch(function(err) {
        res.status(500);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
          error: {
            id: 'unable-to-save-subscription',
            message: 'The subscription was received but we were unable to save it to our database.'
          }
        }));
      });*/
 });
 app.listen(PORT, () => console.log(`Listening on ${ PORT }`));