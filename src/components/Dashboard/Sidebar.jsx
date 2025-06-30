import React, { useState } from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography, Collapse
} from "@mui/material";
import {
  Home,
  Wallet,
  LogOut,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  ClipboardCheck ,
  ChefHat,
  Users,
  CreditCard,
  Info,
  Hamburger,
  HandPlatter,
  CalendarRange
} from "lucide-react";
import { useTheme } from '@mui/material/styles';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import convertToPersian from '../../assets/Converter/ConvertToPersian';
import keycloak from '../../keyclaok/keycloak';
import useRoles from '../../hooks/useRoles';
import { useWallet } from "../../context/WalletContext";

const Sidebar = ({ appVersion }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useRoles();
  const { walletBalance } = useWallet();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const walletVisible = hasRole('Manager') || hasRole('employee');
  const foodVisible = hasRole('Chef') || hasRole('employee') || hasRole('Servant');

  const handleLogout = () => {
    keycloak.logout()
      .then(() => navigate("/login"))
      .catch(err => console.error("Logout error:", err));
  };

  const isActive = (path) => location.pathname === path;
  const toggleWalletMenu = () => setWalletMenuOpen(prev => !prev);
  const toggleFoodMenu = () => setFoodMenuOpen(prev => !prev);

    return (
    <Box flex={1} sx={{ display: { xs: "none", sm: "block" } }}>
      <Box
        position="fixed"
        sx={{
          backgroundColor: "#1e293b",
          color: "#f1f5f9",
          height: "100vh",
          width: "240px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 6px rgba(0,0,0,0.3)",
        }}
      >
        <List sx={{ flexGrow: 1, overflowY: "auto" }}>
          <ListItem disablePadding>
            <ListItemButton sx={{ pointerEvents:'none' }}>
              <ListItemText
                sx={{ textAlign: "right" }}
                primary={
                  <Typography sx={{ color: "#e2e8f0", fontSize: "14px" }}>
                    موجودی کیف پول&nbsp;&nbsp;&nbsp;
                    {walletBalance !== null
                      ? convertToPersian(walletBalance.toLocaleString() + " ریال")
                      : "در حال دریافت..."}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ backgroundColor: "#475569", my: 1 }} />

          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/home"
              selected={isActive("/home")}
              sx={{
                "&.Mui-selected": { backgroundColor: "#3b82f6" },
                "&:hover": { backgroundColor: "#334155" },
              }}
            >
              <ListItemIcon sx={{ color: "#f1f5f9" }}><Home size={20} /></ListItemIcon>
              <ListItemText sx={{ textAlign: "right" }} primary="داشبورد" />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ backgroundColor: "#475569", my: 1 }} />

          {walletVisible && (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={toggleWalletMenu} sx={{ "&:hover": { backgroundColor: "#334155" } }}>
                  <ListItemIcon sx={{ color: "#f1f5f9" }}><Wallet size={20} /></ListItemIcon>
                  <ListItemText sx={{ textAlign: "right" }} primary="کیف پول" />
                  {walletMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </ListItemButton>
              </ListItem>
              <Collapse in={walletMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {hasRole("Manager") && (
                    <ListItemButton
                      component={Link}
                      to="/manage-accounts"
                      selected={isActive("/manage-accounts")}
                      sx={{ pl: 4, "&.Mui-selected": { backgroundColor: "#3b82f6" }, "&:hover": { backgroundColor: "#334155" } }}
                    >
                      <ListItemIcon sx={{ color: "#f1f5f9" }}><Users size={20} /></ListItemIcon>
                      <ListItemText sx={{ textAlign: "right" }} primary="مدیریت حساب‌ها" primaryTypographyProps={{ fontSize: "14px" }} />
                    </ListItemButton>
                  )}
                  {hasRole("employee") && (
                    <ListItemButton
                      component={Link}
                      to="/transaction"
                      selected={isActive("/transaction")}
                      sx={{ pl: 4, "&.Mui-selected": { backgroundColor: "#3b82f6" }, "&:hover": { backgroundColor: "#334155" } }}
                    >
                      <ListItemIcon sx={{ color: "#f1f5f9" }}><CreditCard size={20} /></ListItemIcon>
                      <ListItemText sx={{ textAlign: "right" }} primary="تراکنش‌ها" primaryTypographyProps={{ fontSize: "14px" }} />
                    </ListItemButton>
                  )}
                </List>
              </Collapse>

              <Divider sx={{ backgroundColor: "#475569", my: 1 }} />
            </>
          )}

          {foodVisible && (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={toggleFoodMenu} sx={{ "&:hover": { backgroundColor: "#334155" } }}>
                  <ListItemIcon sx={{ color: "#f1f5f9" }}><ChefHat size={20} /></ListItemIcon>
                  <ListItemText sx={{ textAlign: "right" }} primary="آشپزخانه" />
                  {foodMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </ListItemButton>
              </ListItem>
              <Collapse in={foodMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {hasRole("Chef") && (
                    <ListItemButton 
                      component={Link} 
                      to="/add-food" 
                      selected={isActive("/add-food")} 
                      sx={{ pl: 4, "&.Mui-selected": { backgroundColor: "#3b82f6" }, "&:hover": { backgroundColor: "#334155" } }}
                    >
                      <ListItemIcon sx={{ color: "#f1f5f9" }}><UtensilsCrossed size={20} /></ListItemIcon>
                      <ListItemText sx={{ textAlign: "right" }} primary="منو غذایی" primaryTypographyProps={{ fontSize: "14px" }} />
                    </ListItemButton>
                  )}
                  {hasRole("Chef") && (
                    <ListItemButton
                      component={Link} 
                      to="/add-menu" 
                      selected={isActive("/add-menu")} 
                      sx={{ pl: 4, "&.Mui-selected": { backgroundColor: "#3b82f6" }, "&:hover": { backgroundColor: "#334155" } }}
                    >
                      <ListItemIcon sx={{ color: "#f1f5f9" }}><CalendarRange size={20} /></ListItemIcon>
                      <ListItemText sx={{ textAlign: "right" }} primary="برنامه ماهانه" primaryTypographyProps={{ fontSize: "14px" }} />
                    </ListItemButton>
                  )}
                  {hasRole("employee") && (
                    <ListItemButton 
                      component={Link} 
                      to="/choose-food" 
                      selected={isActive("/choose-food")} 
                      sx={{ pl: 4, "&.Mui-selected": { backgroundColor: "#3b82f6" }, "&:hover": { backgroundColor: "#334155" } }}
                    >
                      <ListItemIcon sx={{ color: "#f1f5f9" }}><Hamburger size={20} /></ListItemIcon>
                      <ListItemText sx={{ textAlign: "right" }} primary="ناهار من" primaryTypographyProps={{ fontSize: "14px" }} />
                    </ListItemButton>
                  )}
                  {hasRole("Chef") && (
                    <ListItemButton 
                      component={Link} 
                      to="/view-list" 
                      selected={isActive("/view-list")} 
                      sx={{ pl: 4, "&.Mui-selected": { backgroundColor: "#3b82f6" }, "&:hover": { backgroundColor: "#334155" } }}
                    >
                      <ListItemIcon sx={{ color: "#f1f5f9" }}><ClipboardCheck size={20} /></ListItemIcon>
                      <ListItemText sx={{ textAlign: "right" }} primary="مشاهده لیست" primaryTypographyProps={{ fontSize: "14px" }} />
                    </ListItemButton>
                  )}
                  {hasRole("Servant") && (
                    <ListItemButton 
                      component={Link} 
                      to="/delivery-list" 
                      selected={isActive("/delivery-list")} 
                      sx={{ pl: 4, "&.Mui-selected": { backgroundColor: "#3b82f6" }, "&:hover": { backgroundColor: "#334155" } }}
                    >
                      <ListItemIcon sx={{ color: "#f1f5f9" }}><HandPlatter size={20} /></ListItemIcon>
                      <ListItemText sx={{ textAlign: "right" }} primary="توزیع غذا" primaryTypographyProps={{ fontSize: "14px" }} />
                    </ListItemButton>
                  )}
                </List>
              </Collapse>

              <Divider sx={{ backgroundColor: "#475569", my: 1 }} />
            </>
          )}

          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ "&:hover": { backgroundColor: "#334155" } }}>
              <ListItemIcon sx={{ color: "#f1f5f9" }}><LogOut size={20} /></ListItemIcon>
              <ListItemText sx={{ textAlign: "right" }} primary="خروج" />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ backgroundColor: "#475569", my: 1 }} />

          <ListItem disablePadding>
            <ListItemButton disabled sx={{ justifyContent: "right", py: 1, gap: 0.5 }}>
              <Info size={14} style={{ marginLeft: 4 }} />
              <Typography variant="caption" sx={{ fontSize: "12px" }}>
                نسخه اپلیکیشن {appVersion}
              </Typography>
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;