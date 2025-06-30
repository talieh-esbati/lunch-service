import { Suspense, lazy} from 'react';
import KeycloakProvider from './keyclaok/KeycloakProvider';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Stack, CircularProgress } from "@mui/material";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Dashboard/Navbar";
import Sidebar from "./components/Dashboard/Sidebar";
import { WalletProvider } from "./context/WalletContext";
import './index.css';

const Feed = lazy(() => import("./components/Dashboard/Feed"));
const ChooseFood = lazy(() => import("./components/Lunch/ChooseFood"));
const AddMenu = lazy(() => import("./components/Lunch/AddMenu"));
const AddFood = lazy(() => import("./components/Lunch/AddFood"));
const ViewList = lazy(() => import("./components/Lunch/ViewList"));
const Transaction = lazy(() => import("./components/Wallet/Transaction"));
const ManageAccounts = lazy(() => import("./components/Wallet/ManageAccounts"));
const DeliveryList = lazy(() => import("./components/Lunch/DeliveryList"));

function App() {

  const darkTheme = createTheme({
    palette: {
      mode: 'light',
      navbar: {
        main: '#33404c',
      }
    },
    typography: {
      fontFamily: 'IRANYekan, sans-serif',
    },
  });

  document.body.dir = 'rtl';
  const appVersion = "1.0.1";

  return (
    <ThemeProvider theme={darkTheme}>
      <Router>
        <KeycloakProvider>
          <WalletProvider>
            <Box bgcolor={"background.default"} color={"text.primary"}>
              <Navbar appVersion={appVersion}/>
              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Sidebar appVersion={appVersion}/>
                <Suspense
                  fallback={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100vh",
                        width: "100%",
                      }}
                    >
                      <CircularProgress color="primary" />
                    </Box>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Navigate to="/home" />} />
                    <Route path="/home" element={<Feed />} />
                    <Route path="/manage-accounts" element={<ManageAccounts />} />
                    <Route path="/transaction" element={<Transaction />} />
                    <Route path="/choose-food" element={<ChooseFood />} />
                    <Route path="/add-menu" element={<AddMenu />} />
                    <Route path="/add-food" element={<AddFood />} />
                    <Route path="/view-list" element={<ViewList />} />
                    <Route path="/delivery-list" element={<DeliveryList />} />
                    <Route path="*" element={<Navigate to="/home" />} />
                  </Routes>
                </Suspense>
              </Stack>
            </Box>
          </WalletProvider>
        </KeycloakProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;