function handlePermission() {
  console.log("handlePermission")
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