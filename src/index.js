// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import keycloak from './keyclaok/keycloak';

keycloak.init({ onLoad: 'login-required', checkLoginIframe: false })
  .then(authenticated => {
    //console.log('authenticated:', authenticated);
    console.log('keycloak',keycloak)
    if (authenticated) {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    } else {
      console.warn('User is not authenticated');
    }
  })
.catch(console.error);

