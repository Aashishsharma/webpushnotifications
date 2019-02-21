function handlePermission() {
 /* console.log("handlePermission")
    return navigator.permissions
            .query({name:'notifications'})
            .then(permissionQuery);
}

function permissionQuery(result) {
    console.debug({result});
    var newPrompt;

    if (result.state == 'granted') {
       console.log('granted');

    } else if (result.state == 'prompt') {
         document.getElementById('categoryPopUp').style.display = "block";

    } else if (result.state == 'denied') {
        console.log('denied');
    }*/
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    console.log('For Microsoft edge test');
    document.getElementById('categoryPopUp').style.display = "block";
  }

   }

  function checkStatus(selectedCategories) {
    console.log("checkStatus");
  if (!('serviceWorker' in navigator)) {
  console.log('Service Worker isnt supported on this browser, disable or hide UI.');
  return;
}

if (!('PushManager' in window)) {
    console.log('Service Worker isnt supported on this browser, disable or hide UI.');
  return;
}
console.log('Service worker is supported');
registerServiceWorker(selectedCategories);

}

function registerServiceWorker(selectedCategories) {
  console.log('register service worker');
  return navigator.serviceWorker.register('service-worker.js')
  .then(function(registration) {
    console.log('Service worker successfully registered.');
    askPermission();
    subscribeUserToPush(selectedCategories);
    return registration;
  })
  .catch(function(err) {
    console.error('Unable to register service worker.', err);
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
  ;
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}


function subscribeUserToPush(selectedCategories) {
  console.log("subscribeUserToPush");
  return navigator.serviceWorker.register('service-worker.js')
  .then(function(registration) {
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BIY6zwhkwWk68u5Xzh_NYKwEzsEpOLsSSEdxDHLZWaGWEQOvAWpZ8iJJEqJof2y6BnIxNrPFo4v3tGO4wbkyywY'
      )
    };

    return registration.pushManager.subscribe(subscribeOptions);
  })
  .then(function(pushSubscription) {
    sendSubscriptionToBackEnd(pushSubscription, selectedCategories);
    console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
    return pushSubscription;
  });
}

function askPermission() {
  console.log('ask permission');
  return new Promise(function(resolve, reject) {
    const permissionResult = Notification.requestPermission(function(result) {
      resolve(result);
    });

    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  })
  .then(function(permissionResult) {
    if (permissionResult !== 'granted') {
      showAlertForFuture();
      throw new Error('We weren\'t granted permission.');
    }
  });
}



function sendSubscriptionToBackEnd(subscription, selectedCategories) {
  console.log("sendSubscriptionToBackEnd");

  var subs = {subscription:subscription, userPreferences: {categories: selectedCategories, appId: 'app1', pfgStatCookie: "null"}};
  return fetch('/api/save-subscription/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subs) 
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Bad status code from server.');
    }

    return response.json();
  })
  .then(function(responseData) {
    if (!(responseData.data && responseData.data.success)) {
      throw new Error('Bad response from server.');
    }
  });
}

function sendUpdatedUserPreferences(subscription){
  var cookiesFromBrowser = document.cookie;
  var storedPfgStatCookie= getCookie("pfgStatCookie");
  console.log("cookies: ", cookiesFromBrowser);
  console.log("read from cookie: ", storedPfgStatCookie);
  var preferences = {endpoint: subscription.endpoint, pfgStatCookie: storedPfgStatCookie};
  console.log("preferences: " , JSON.stringify(preferences));
  return fetch('/api/update-userpreferences/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preferences)
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Bad status code from server.');
    }

    return response.json();
  })
  .then(function(responseData) {
    if (!(responseData.data && responseData.data.success)) {
      throw new Error('Bad response from server.');
    }
  });
 }

 function readSubscription(){
    // We need the service worker registration to check for a subscription
    navigator.serviceWorker.ready.then(function (reg) {
       // Do we already have a push message subscription?
      reg.pushManager.getSubscription()
        .then(function (subscription) {
          console.log("subscription: ", subscription);
            if (!subscription) {
                console.log('Not yet subscribed to Push')
                isSubscribed = false;
               
            } else {
                // initialize status, which includes setting UI elements for subscribed status
                // and updating Subscribers list via push
                console.log("isSubscribed: ", subscription.endpoint);
                isSubscribed = true;
                sendUpdatedUserPreferences(subscription);
               
            }
        })
        .catch(function (err) {
            console.log('Error during getSubscription()', err);
        });
});

 }

 function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
