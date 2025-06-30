import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance/axiosWithAuth';
import {
  Box, Typography, Paper, TableContainer,
  Table, TableHead, TableRow, TableCell, TableBody,
  Pagination, CircularProgress, Stack
} from '@mui/material';
import convertToPersian from '../../assets/Converter/ConvertToPersian';
import PersianNumberSplitter from '../../assets/Converter/PersianNumSplitter';
import keycloak from '../../keyclaok/keycloak';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Transaction = () => {
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleGetTransaction = async (pageNumber = 0) => {
        setLoading(true);
        const walletUuid = keycloak.tokenParsed.WalletId;
        const limit = rowsPerPage;
        const offset = pageNumber * limit;
        try {
            const response = await axiosInstance.get(
                ` {Wallet_Service_Address}/api/finance/transaction/?wallet_uuid=${walletUuid}&limit=${rowsPerPage}&offset=${offset}`,
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );

            const fetched = response.data;
            const list = Array.isArray(fetched.results) ? fetched.results : [];

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
        handleGetTransaction(0);
    }, []);

    const formatDateTime = (isoString) => {
        const d = new Date(isoString);
        const datePart = d.toLocaleDateString('fa-IR');
        const timePart = d.toLocaleTimeString('fa-IR');
        return `${timePart} - ${datePart}`;
    };

    return (
        <Box p={2} flex={5}>
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
                لیست تراکنش‌های کیف پول
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" mt={40}>
                    <CircularProgress />
                </Box>
                ) : rows.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                    <TableContainer component={Paper} sx={{ width: { xs: '350px', sm: '100%' } }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell sx={{ width: '10px', textAlign: 'center' }}>#</TableCell>
                                    <TableCell sx={{ width: '100px', textAlign: 'center' }}>تاریخ تراکنش</TableCell>
                                    <TableCell sx={{ width: '100px', textAlign: 'center' }}>مبلغ</TableCell>
                                    <TableCell sx={{ width: '50px', textAlign: 'center' }}>بابت</TableCell>
                                    <TableCell sx={{ width: '50px', textAlign: 'center' }}>توسط</TableCell>
                                    <TableCell sx={{ width: '100px', textAlign: 'center' }}>موجودی</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row, index) => (
                                    <TableRow key={row.id}>
                                        <TableCell align="center">
                                            {convertToPersian(page * rowsPerPage + index + 1)}
                                        </TableCell>
                                        <TableCell align="center">
                                            {formatDateTime(row.created_at)}
                                        </TableCell>
                                        <TableCell sx={{ color: row.action === 'deduct' ? 'error.main' : 'success.main', fontWeight: 'bold' }} align="center">
                                            {PersianNumberSplitter(row.amount)} ریال
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.due_display}
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.changed_by}
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                            {PersianNumberSplitter(row.balance)} ریال
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Stack spacing={2} alignItems="center" mt={2}>
                        <Pagination
                            count={pageCount}
                            page={page + 1}
                            onChange={(e, value) => handleGetTransaction(value - 1)}
                            shape="rounded"
                            color="primary"
                        />
                    </Stack>
                </Box>
                ) : (
                    <Typography align="center" color="#000000ad" mt={10}>هیچ تراکنشی وجود ندارد!</Typography>
                )
            }
        </Box>
    );
};

export default Transaction;