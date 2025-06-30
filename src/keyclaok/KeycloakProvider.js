import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import keycloak from './keycloak';
import { CircularProgress, Box, Typography } from '@mui/material';

const KeycloakProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(keycloak.authenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authenticated) {
      keycloak.init({ onLoad: 'login-required' })
        .then((auth) => {
          setAuthenticated(auth);
        })
        .catch(() => {
          setAuthenticated(false);
        });
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) {
      navigate("/home");
      const refreshInterval = setInterval(() => {
        keycloak.updateToken(60).catch(() => {
          keycloak.logout();
        });
      }, 6000);

      return () => clearInterval(refreshInterval);
    }
  }, [authenticated]);

  if (authenticated === null) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <CircularProgress color="primary" />
        <Typography variant="h6" mt={3}>
          در حال بارگذاری اطلاعات ورود...
        </Typography>
      </Box>
    );
  }

  if (!authenticated) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        color="error.main"
      >
        <Typography variant="h6" color="error">
          ورود ناموفق بود. لطفاً دوباره تلاش کنید.
        </Typography>
      </Box>
    );
  }

  return children;
};

export default KeycloakProvider;
