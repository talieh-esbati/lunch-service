import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance/axiosWithAuth';
import {
  Box, Typography, Paper, TableContainer,TextField,
  Table, TableHead, TableRow, TableCell, TableBody,Button,
  Pagination, CircularProgress, Stack, Tooltip, IconButton, Modal, MenuItem, Select
} from '@mui/material';
import RecordIcon from '@mui/icons-material/FiberManualRecord';
import convertToPersian from '../../assets/Converter/ConvertToPersian';
import PersianNumberSplitter from '../../assets/Converter/PersianNumSplitter';
import keycloak from '../../keyclaok/keycloak';
import { toast, ToastContainer } from 'react-toastify';
import { Edit, Delete } from '@mui/icons-material';
import { useWallet } from "../../context/WalletContext";
import 'react-toastify/dist/ReactToastify.css';

const ManageAccounts = () => {
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [pageCount, setPageCount] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [selectedWalletName, setSelectedWalletName] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editWalletName, setEditWalletName] = useState('');
    const [editBalance, setEditBalance] = useState('');
    const [showChangeAllModal, setShowChangeAllModal] = useState(false);
    const [newAllBalance, setNewAllBalance] = useState('');
    const [submittingAllBalance, setSubmittingAllBalance] = useState(false);
    const [actionOptions, setActionOptions] = useState([]);
    const [dueOptions, setDueOptions] = useState([]);
    const [isIncreaseModalVisible, setIsIncreaseModalVisible] = useState(false);
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedDue, setSelectedDue] = useState('');
    const [increaseAmount, setIncreaseAmount] = useState('');
    const { fetchWalletBalance } = useWallet();

    useEffect(() => {
        const fetchInitData = async () => {
            try {
                const response = await fetch(' {Wallet_Service_Address}/api/utils/choices/');
                const data = await response.json();
                setActionOptions(data.results.transaction_action || []);
                setDueOptions(data.results.transaction_due || []);
            } catch (error) {
                console.error('خطا در گرفتن اطلاعات اولیه:', error);
            }
        };
        fetchInitData();
    }, []);

    const handleGetWallets = async (pageNumber = 0) => {
        setLoading(true);
        const limit = rowsPerPage;
        const offset = pageNumber * limit;
        try {
            const response = await axiosInstance.get(
                ` {Wallet_Service_Address}/api/finance/wallet/?limit=${rowsPerPage}&offset=${offset}`,
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );

            const fetched = response.data;
            const list = Array.isArray(fetched)
                ? fetched
                : Array.isArray(fetched.results)
                ? fetched.results
                : [];

            setRows(list);
            setPage(pageNumber);
            setPageCount(Math.ceil(fetched.count / limit));
        } catch (error) {
            console.error(error);
            toast.error('خطا در دریافت تراکنش‌ها.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleGetWallets(0);
    }, []);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.delete(
                ` {Wallet_Service_Address}/api/finance/wallet/${selectedWalletId}`,
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
    
            const statusCode = response.status;
            console.log('Status Code:', statusCode);

            if (statusCode === 200 || statusCode === 204) {
                toast.success('کیف پول با موفقیت حذف شد');
                setIsModalVisible(false);
            } else {
                toast.warn('عملیات حذف موفق نبود');
            }
    
            setSelectedWalletId(null);
            setIsModalVisible(false);
            await handleGetWallets(0);
        } catch (error) {
            console.error(error);
            if (error.response) {
                console.log('Error Status Code:', error.response.status);
            }
            toast.error('حذف کیف پول با خطا مواجه شد.');
        } finally {
            setLoading(false);
        }
    };    

    const handleOpenEditModal = (wallet) => {
        setSelectedWalletId(wallet.uuid);
        setEditWalletName(wallet.full_name);
        setEditBalance(0);
        setIsEditModalVisible(true);
    };

    const handleUpdateWallet = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.post(
                ` {Wallet_Service_Address}/api/finance/transaction/`,
                { 
                    action: selectedAction,
                    due: selectedDue,
                    amount: editBalance,
                    wallet_uuid: selectedWalletId
                },
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
    
            if (response.status === 200) {
                toast.success('موجودی کیف پول با موفقیت بروزرسانی شد');
                setIsEditModalVisible(false);
                setSelectedWalletId(null);
                setSelectedAction('');
                setSelectedDue('');
                setEditBalance('');
                await handleGetWallets(0);
                await fetchWalletBalance();
            } else {
                toast.error('بروزرسانی با خطا مواجه شد');
            }
        } catch (error) {
            console.error(error);
            toast.error('خطا در بروزرسانی کیف پول');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (id,name) => {
        setSelectedWalletId(id);
        setSelectedWalletName(name);
        setIsModalVisible(true)
    };
    
    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    const handleSubmitAllBalance = async () => {
        setSubmittingAllBalance(true);
        try {
            const response = await axiosInstance.post(
                ' {Wallet_Service_Address}/api/finance/all-wallet/',
                { balance: Number(newAllBalance) },
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
    
            if (response.status === 200 || response.status === 204) {
                toast.success('موجودی همه کاربران با موفقیت تغییر کرد');
                setShowChangeAllModal(false);
                setNewAllBalance('');
                await handleGetWallets(0); 
            } else {
                toast.error('خطا در تغییر موجودی کاربران');
            }
        } catch (error) {
            console.error(error);
            toast.error('خطا در اتصال به سرور');
        } finally {
            setSubmittingAllBalance(false);
        }
    };

    const handleSubmitIncrease = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.post(
                ' {Wallet_Service_Address}/api/finance/all-transaction/',
                {
                    action: selectedAction,
                    amount: Number(increaseAmount),
                    due: selectedDue
                },
                {
                    headers: { Authorization: `Bearer ${keycloak.token}` }
                }
            );
            const errorMessage = response?.response?.data?.detail || 'عملیات با موفقیت انجام شد';
            toast.success(errorMessage);
            setIsIncreaseModalVisible(false);
            setSelectedAction('');
            setSelectedDue('');
            setIncreaseAmount('');
            await handleGetWallets(0); 
        } catch (error) {
            setIsIncreaseModalVisible(false);
            const errorMessage = error?.response?.data?.detail || 'خطا در انجام عملیات';
            toast.error(errorMessage);
            console.error(error);
        }
        finally {
            setLoading(false);
        }
    };

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 320,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 24,
        p: 3,
    };

    const formatDateTime = (isoString) => {
        const d = new Date(isoString);
        const datePart = d.toLocaleDateString('fa-IR');
        const timePart = d.toLocaleTimeString('fa-IR');
        return `${timePart} - ${datePart}`;
    };

    const sortedRows = React.useMemo(() => {
        return [...rows].sort((a, b) => {
          const fa = a.floor;
          const fb = b.floor;
      
          if (fa === null || fa === undefined) return 1;
          if (fb === null || fb === undefined) return -1;
      
          return fa - fb;
        });
    }, [rows]);

    return (
        <Box p={2} flex={5}>
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button variant="outlined" onClick={() => setIsIncreaseModalVisible(true)} color="success" sx={{ ml: 1 }} >
                    تخصیص موجودی کاربران
                </Button>
                {/* <Button variant="outlined" onClick={() => setShowChangeAllModal(true)} color="warning" >
                    تغییر موجودی کاربران
                </Button> */}
            </Box>
            <ToastContainer position="bottom-right" autoClose={5000} rtl pauseOnHover />
            <Typography 
                variant="h6" 
                mb={2} 
                align="center"
                fontWeight="bold"
                sx={{
                    textAlign: { xs: 'center', sm: 'right' },
                    marginBottom: { xs: '10px', sm: 3 },
                    fontSize: { xs: '14px', sm: '16px' },
                }}
            >
                مدیریت حسابها
            </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" mt={40}>
                    <CircularProgress />
                    </Box>
                ) : (
                <Box sx={{ overflowX:'auto' }}>
                    <TableContainer component={Paper} sx={{ width:{ xs:'350px', sm:'100%' }}}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell sx={{ width: '10px', textAlign: 'center' }}>#</TableCell>
                                    <TableCell sx={{ width: '50px', textAlign: 'center' }}>نام کاربر</TableCell>
                                    <TableCell sx={{ width: '50px', textAlign: 'center' }}>طبقه</TableCell>
                                    <TableCell sx={{ width: '100px', textAlign: 'center' }}>تاریخ ایجاد کیف پول</TableCell>
                                    <TableCell sx={{ width: '100px', textAlign: 'center' }}>آخرین بروزرسانی کیف پول</TableCell>
                                    <TableCell sx={{ width: '100px', textAlign: 'center' }}>موجودی</TableCell>
                                    <TableCell sx={{ width: '100px', textAlign: 'center' }}>وضعیت کیف پول</TableCell>
                                    <TableCell sx={{ width: '100px', textAlign: 'center' }}>عملیات</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedRows
                                    .map((row,index) => (
                                    <TableRow key={row.id}>
                                        <TableCell align="center">
                                            {convertToPersian(page * rowsPerPage + index + 1)}
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.full_name}
                                        </TableCell>
                                        <TableCell 
                                            align="center"
                                            sx={{color:'#006BD6'}}
                                        >
                                            <Box
                                                component="span"
                                                sx={{
                                                    display: 'inline-block',      
                                                    backgroundColor: '#e0f7fa',   
                                                    color: '#006064',             
                                                    borderRadius: '8px',          
                                                    px: 1,                        
                                                    py: 0.5,                      
                                                    fontWeight: 'bold',           
                                                    fontSize: '0.85rem',        
                                                }}
                                            >
                                                {convertToPersian(row.floor === null ? '---' : row.floor)}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            {formatDateTime(row.created_at)} 
                                        </TableCell>
                                        <TableCell align="center">
                                            {formatDateTime(row.updated_at)} 
                                        </TableCell>
                                        <TableCell align="center" sx={{fontWeight:'bold'}}>
                                            {PersianNumberSplitter(row.balance)} ریال
                                        </TableCell>   
                                        <TableCell align="center">
                                            <Tooltip title={row.is_deleted ? "غیر فعال" : "فعال"}>
                                                <RecordIcon
                                                    sx={{
                                                        color: row.is_deleted ? 'red' : 'green',
                                                        fontSize: 14,
                                                        cursor: 'default',
                                                    }}
                                                />
                                            </Tooltip>
                                        </TableCell>   
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <IconButton disabled={row.is_deleted} onClick={() => handleOpenEditModal(row)} color="primary" size="small">
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            {/* <IconButton disabled={row.is_deleted} onClick={() => handleOpenModal(row.uuid,row.full_name)} color="error" size="small">
                                                <Delete fontSize="small" />
                                            </IconButton> */}
                                        </TableCell>    
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Stack spacing={2} alignItems="center" mt={2}>
                        <Pagination
                            count={pageCount}
                            page={page+1}
                            onChange={(e, value) => handleGetWallets(value-1)}
                            shape="rounded"
                            color="primary"
                        />
                    </Stack>
                </Box>
            )}
            <Modal
                open={isModalVisible}
                onClose={handleCloseModal}
            >
                <Box sx={modalStyle}>
                    <Typography variant="body" mb={2}> آیا از حذف کیف پول "{selectedWalletName}" مطمئن هستید؟ </Typography>
                    <Stack direction="row" justifyContent="flex-end" spacing={1} mt={3}>
                        <Button onClick={handleCloseModal} disabled={loading}>لغو</Button>
                        <Button variant="contained" color="success" disabled={loading} onClick={handleDelete}>حذف</Button>
                    </Stack>
                </Box>
            </Modal>
            <Modal open={isEditModalVisible} onClose={() => setIsEditModalVisible(false)}>
                <Box sx={modalStyle}>
                    <Typography variant="body" sx={{fontWeight:'bold'}} mb={2}>
                        تخصیص موجودی به کیف پول "{editWalletName}"
                    </Typography>
                    <Select
                        fullWidth
                        size="small"
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        displayEmpty
                        sx={{ mb: 2,mt: 4 }}
                    >
                        <MenuItem value="" disabled>نوع عملیات</MenuItem>
                        {actionOptions.map((item) => (
                            <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                        ))}
                    </Select>

                    <Select
                        fullWidth
                        size="small"
                        value={selectedDue}
                        onChange={(e) => setSelectedDue(e.target.value)}
                        displayEmpty
                    >
                        <MenuItem value="" disabled>بابت</MenuItem>
                        {dueOptions.map((item) => (
                            <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                        ))}
                    </Select>
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value)}
                        sx={{ mt: 3 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                    />
                    <Stack direction="row" justifyContent="flex-end" spacing={1} mt={3}>
                        <Button onClick={() => setIsEditModalVisible(false)} disabled={loading}>لغو</Button>
                        <Button variant="contained" color="primary" disabled={!selectedAction || !selectedDue || editBalance === 0 || loading} onClick={handleUpdateWallet}>ذخیره</Button>
                    </Stack>
                </Box>
            </Modal>
            <Modal open={showChangeAllModal} onClose={() => setShowChangeAllModal(false)}>
                <Box sx={modalStyle}>
                    <Typography variant="body" sx={{fontWeight:'bold'}} mb={2}>
                        آیا مایل به تغییر موجودی کاربران هستید؟
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="موجودی جدید"
                        value={newAllBalance}
                        onChange={(e) => setNewAllBalance(e.target.value)}
                        sx={{ mt: 3 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                    />
                    <Stack direction="row" justifyContent="flex-end" spacing={1} mt={3}>
                        <Button onClick={() => setShowChangeAllModal(false)} disabled={submittingAllBalance}>لغو</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={submittingAllBalance || newAllBalance === ''}
                            onClick={handleSubmitAllBalance}
                        >
                            ثبت
                        </Button>
                    </Stack>
                </Box>
            </Modal>
            <Modal open={isIncreaseModalVisible} onClose={() => setIsIncreaseModalVisible(false)}>
                <Box sx={modalStyle}>
                    <Typography variant="subtitle1" mb={2}>
                        افزایش موجودی کاربران
                    </Typography>

                    <Select
                        fullWidth
                        size="small"
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        displayEmpty
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="" disabled>نوع عملیات</MenuItem>
                        {actionOptions.map((item) => (
                            <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                        ))}
                    </Select>

                    <Select
                        fullWidth
                        size="small"
                        value={selectedDue}
                        onChange={(e) => setSelectedDue(e.target.value)}
                        displayEmpty
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="" disabled>بابت</MenuItem>
                        {dueOptions.map((item) => (
                            <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                        ))}
                    </Select>

                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="مبلغ"
                        value={increaseAmount}
                        onChange={(e) => setIncreaseAmount(e.target.value)}
                        sx={{ mb: 2 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                    />

                    <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
                        <Button onClick={() => setIsIncreaseModalVisible(false)}>لغو</Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleSubmitIncrease}
                            disabled={!selectedAction || !selectedDue || !increaseAmount || loading }
                        >
                            ثبت
                        </Button>
                    </Stack>
                </Box>
            </Modal>
        </Box>
    );
};

export default ManageAccounts;
