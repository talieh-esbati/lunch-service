import { useState, useEffect, useCallback } from 'react';
import keycloak from '../keyclaok/keycloak';

const useRoles = () => {
  const [resourceAccess, setResourceAccess] = useState({});

  useEffect(() => {
    if (keycloak.authenticated && keycloak.tokenParsed) {
      setResourceAccess(keycloak.tokenParsed.resource_access || {});
    }
  }, []);

  const hasRole = useCallback((expectedRole) => {
    return Object.values(resourceAccess).some((client) =>
      client.roles?.includes(expectedRole)
    );
  }, [resourceAccess]);

  return { hasRole };
};

export default useRoles;
