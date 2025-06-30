import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, styled, Menu, MenuItem, Box, Avatar, Divider } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom'; 
import dayjs from 'dayjs';
import jalaliPlugin from 'jalali-dayjs';
import convertToPersian from '../../assets/Converter/ConvertToPersian';
import keycloak from '../../keyclaok/keycloak';
import useRoles from '../../hooks/useRoles';
import { useWallet } from "../../context/WalletContext";

const StyledToolbar = styled(Toolbar)({ display: "flex", justifyContent: "space-between" });
dayjs.extend(jalaliPlugin);

const Icons = styled(Box)(({ theme }) => ({
  display: "none",
  alignItems: "center",
  gap: "20px",
  [theme.breakpoints.up("sm")]: { display: "flex" }
}));

const Navbar = ({ appVersion }) => {
  const theme = useTheme();
  const today = dayjs().locale('fa').format('dddd , D MMMM YYYY');
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState('');
  const navigate = useNavigate();
  const { hasRole } = useRoles();
  const { walletBalance } = useWallet();
  const walletVisible = hasRole('Manager') || hasRole('employee');
  const foodVisible   = hasRole('Chef')    || hasRole('employee') || hasRole('Servant');

  const toggleSubmenu = (name) => setSubmenu(prev => prev === name ? '' : name);
  const handleLogout = () => keycloak.logout().then(() => navigate('/login')).catch(console.error);
  const handleClick = (path) => { navigate(path); setOpen(false); };

  return (
    <AppBar position="sticky" sx={{ 
        //backgroundImage: "linear-gradient(135deg, #9333ea, #3b82f6)"
        backgroundColor: "#1e293b", 
        boxShadow: "2px 0 6px rgba(0,0,0,0.3)",
      }}>
      <StyledToolbar>
        <Icons>
          <Avatar sx={{ width: 30, height: 30 }} />
          <Typography variant="body" sx={{ display: { xs: "none", sm: "block" } }}>
            {keycloak.tokenParsed.name} عزیز خوش آمدید
          </Typography>
        </Icons>
        <MenuIcon sx={{ display: { xs: "block", sm: "none" } }} onClick={() => setOpen(true)} />
        <Typography sx={{ fontSize: { xs: "12px", sm: "16px" }, display: { xs: "block", sm: "none" } }}>
          کیف پول شما: {walletBalance !== null ? convertToPersian(walletBalance.toLocaleString() + ' ریال') : 'در حال دریافت...'}
        </Typography>
        <Typography sx={{ fontSize: { xs: "12px", sm: "16px" } }}>
          {convertToPersian(today)}
        </Typography>
      </StyledToolbar>

      <Menu open={open} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={() => handleClick('/home')}>داشبورد</MenuItem>
        <Divider />

        {walletVisible && (
          <>
            <MenuItem onClick={() => toggleSubmenu('wallet')}>کیف پول {submenu === 'wallet' ? <ExpandLess/> : <ExpandMore/>}</MenuItem>
            {submenu === 'wallet' && [
              hasRole('Manager') ? { label: 'مدیریت حساب‌ها', path: '/manage-accounts' } : null,
              hasRole('employee') ? { label: 'تراکنش‌ها', path: '/transaction' } : null
            ].filter(Boolean).map(i => <MenuItem key={i.path} sx={{ pl:4 }} onClick={() => handleClick(i.path)}>{i.label}</MenuItem>)}
            <Divider />
          </>
        )}

        {foodVisible && (
          <>
            <MenuItem onClick={() => toggleSubmenu('food')}>آشپزخانه {submenu === 'food' ? <ExpandLess/> : <ExpandMore/>}</MenuItem>
            {submenu === 'food' && [
              hasRole('Chef') ? { label: 'منو غذایی', path: '/add-food' } : null,
              hasRole('Chef') ? { label: 'برنامه ماهانه', path: '/add-menu' } : null,
              hasRole('employee') ? { label: 'ناهار من', path: '/choose-food' } : null,
              hasRole('Chef') ? { label: 'مشاهده لیست', path: '/view-list' } : null,
              hasRole('Servant') ? { label: 'توزیع غذا', path: '/delivery-list' } : null
            ].filter(Boolean).map(i => <MenuItem key={i.path} sx={{ pl:4 }} onClick={() => handleClick(i.path)}>{i.label}</MenuItem>)}
            <Divider />
          </>
        )}

        <MenuItem onClick={handleLogout}>خروج</MenuItem>
        <Divider />
        <Typography variant="caption" sx={{ display: 'flex', textAlign: 'center', color: theme.palette.text.secondary, fontSize: '12px', gap: 0.5, px: 2, alignItems: 'center' }}>
          <InfoOutlinedIcon fontSize="small" /> نسخه اپلیکیشن {appVersion}
        </Typography>
      </Menu>
    </AppBar>
  );
};

export default Navbar;
