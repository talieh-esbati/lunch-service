import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://360id.ir/', 
  realm: 'Burux',  
  clientId: 'EmployeePortal'
});

export default keycloak;
