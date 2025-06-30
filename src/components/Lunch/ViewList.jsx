import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper, TableContainer, Grid,TableFooter,
  Table, TableHead, TableRow, TableCell, TableBody, Stack,Pagination
} from '@mui/material';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import convertToPersian from '../../assets/Converter/ConvertToPersian';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from "dayjs";

const ViewList = () => {
  const today = dayjs().startOf("day");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [floor, setFloor] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [totalRows, setTotalRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [summaryPage, setSummaryPage] = useState(0);
  const [summaryPerPage, setSummaryPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    return dateObj.toDate().toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (fromDate && toDate) {
      const from = dayjs(fromDate).format("YYYY-MM-DD");
      const to = dayjs(toDate).format("YYYY-MM-DD");
  
      fetch(` {Lunch_Service_Address}/api/UserChoice/GetKitchenMenuReserved?fromDate=${from}&toDate=${to}`)
        .then(res => res.json())
        .then(data => {
        const choices = data.result?.usersChoices || [];
        const total = data.result?.totalReserved || [];
        const usersChoices = choices.map(item => ({
          id: item.id,
          userId: item.userId,
          name: item.userName || '---',
          floor: item.floor === null ? '---' : item.floor,
          comment: item.comment || '---',
          food: item.kitchenMenu.food.name,
          count: item.count || 1,
          date: item.kitchenMenu.date,
          kitchenMenuId: item.kitchenMenu.id,
          type: item.kitchenMenu.food.foodTypeName,
          status: item.deliverStatus,
        }));
        const totalReserved = total.map(item => ({
          id: item.id,
          floor: item.floor === null ? '---' : item.floor,
          food: item.foodName,
          count: item.count,
          date: item.dateTime,
          guest: item.guestCount
        }));
        setFilteredRows(usersChoices);
        setTotalRows(totalReserved);
        setPage(0);
        setSummaryPage(0); 
      });
    }
  }, [fromDate, toDate]);

  const handleSearch = async () => {

    if (!startDate || !endDate ) {
      toast.warn('لطفاً تاریخ را انتخاب کنید.');
      return;
    }

    setLoading(true);
    const fromDate = formatDate(startDate);
    const toDate = formatDate(endDate);

    try {
      const res = await fetch(
        ` {Lunch_Service_Address}/api/UserChoice/GetKitchenMenuReserved?fromDate=${fromDate}&toDate=${toDate}&floor=${floor}`
      );
      if (!res.ok) throw new Error('Network response was not ok');
      const body = await res.json();
      const choices = body.result?.usersChoices || [];
      const total = body.result?.totalReserved || [];
      const usersChoices = choices.map(item => ({
        id: item.id,
        userId: item.userId,
        name: item.userName || '---',
        floor: item.floor === null ? '---' : item.floor,
        comment: item.comment || '---',
        food: item.kitchenMenu.food.name,
        count: item.count || 1,
        date: item.kitchenMenu.date,
        kitchenMenuId: item.kitchenMenu.id,
        type: item.kitchenMenu.food.foodTypeName,
        status: item.deliverStatus,
      }));
      const totalReserved = total.map(item => ({
        id: item.id,
        floor: item.floor === null ? '---' : item.floor,
        food: item.foodName,
        count: item.count,
        date: item.dateTime,
        guest: item.guestCount
      }));
      if (usersChoices.length === 0) {
        toast.info('هیچ نتیجه‌ای یافت نشد.');
      }
      if (totalReserved.length === 0) {
        toast.info('هیچ نتیجه‌ای یافت نشد.');
      }
      setFilteredRows(usersChoices);
      setTotalRows(totalReserved);
      setPage(0);
      setSummaryPage(0);
    } catch (error) {
      console.error(error);
      toast.error('خطا در دریافت داده‌ها.');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'لیست سفارش‌ها');
    XLSX.writeFile(workbook, 'orders.xlsx');
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'لیست سفارش‌ها',
  });

  const pageCount = Math.ceil(filteredRows.length / rowsPerPage);
  const summaryPageCount = Math.ceil(totalRows.length / summaryPerPage);

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    const datePart = d.toLocaleDateString('fa-IR');
    return `${datePart}`;
  };

  const totalFoodCount = totalRows.reduce((sum, item) => sum + item.count, 0);

  return (
    <Box p={2} flex={5}>
      {/* <Typography variant="h6" mb={2}>مشاهده لیست سفارش‌ها</Typography> */}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Stack direction="column" spacing={2} mb={3}>
            <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
                <Grid item xs={12} sm="auto">
                    <Typography 
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          textAlign: { xs: 'center', sm: 'right' },
                          marginBottom: { xs: '10px', sm: 3 },
                          fontSize: { xs: '14px', sm: '16px' },
                        }}
                    >
                      مشاهده لیست سفارش‌ها
                    </Typography>
                </Grid>

                {filteredRows.length > 0 && (
                  <Grid item xs={12} sm="auto">
                    <Stack direction="row" flexWrap="wrap">
                        <Button
                          onClick={exportToExcel}
                          variant="outlined"
                          color="success"
                          startIcon={<FileDownloadIcon />}
                          sx={{
                            px: 2,
                            py: 0.7,
                            gap: 1.2,
                            ml: '5px',
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                            اکسل
                        </Button>
                        <Button
                            onClick={handlePrint}
                            variant="outlined"
                            color="secondary"
                            startIcon={<PrintIcon />}
                            sx={{
                                px: 2,
                                py: 0.7,
                                gap: 1.2,
                                borderRadius: "8px",
                                fontSize: "0.85rem",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                            }}
                        >
                            پرینت
                        </Button>
                    </Stack>
                  </Grid>
                )}
            </Grid>

            <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={6} sm={2}>
                    <Typography variant="body2" mb={0.5}>از تاریخ:</Typography>
                    <DatePicker
                        value={startDate}
                        onChange={setStartDate}
                        calendar={persian}
                        locale={persian_fa}
                        inputClass="custom-date-input"
                        style={{
                        width: '100%',
                        height: '30px',
                        borderRadius: '4px',
                        border: '1px solid #b3b3b3',
                        }}
                    />
                </Grid>

                <Grid item xs={6} sm={2}>
                    <Typography variant="body2" mb={0.5}>تا تاریخ:</Typography>
                    <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        calendar={persian}
                        locale={persian_fa}
                        inputClass="custom-date-input"
                        style={{
                        width: '100%',
                        height: '30px',
                        borderRadius: '4px',
                        border: '1px solid #b3b3b3',
                        }}
                    />
                </Grid> 

                <Grid item xs={12} sm='auto'>
                    <Typography variant="body2" mb={0.5}>طبقه:</Typography>
                    <TextField
                        variant="outlined"
                        type="number"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{
                        '& .MuiInputBase-root': {
                            height: '34px',
                            fontSize: '0.85rem',
                            paddingRight: 1,
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: '0.8rem',
                        },
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                    size="small"
                    fullWidth
                    disabled={loading || !startDate || !endDate}
                    sx={{ height:36, borderRadius:2, fontSize:'0.85rem' }}
                  >
                    {loading ? 'در حال دریافت...' : 'جستجو'}
                  </Button>
                </Grid>
            </Grid>
        </Stack>

        {filteredRows.length > 0 ? (
          <Box sx={{ overflowX:'auto' }}>
            <div ref={printRef}>
              <TableContainer component={Paper} sx={{ width:{ xs:'350px', sm:'100%' } }}>
                <Table>
                  <TableHead sx={{ bgcolor:'#f5f5f5' }}>
                    <TableRow>
                      <TableCell align="center">ردیف</TableCell>
                      <TableCell align="center">تاریخ</TableCell>
                      <TableCell align="center">نام کاربر</TableCell>
                      <TableCell align="center">طبقه</TableCell>
                      <TableCell align="center">نام غذا</TableCell>
                      <TableCell align="center">تعداد</TableCell>
                      <TableCell align="center">مدل غذا</TableCell>
                      <TableCell align="center">وضعیت</TableCell>
                      {/* <TableCell align="center">توضیحات</TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows
                      .slice() 
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, index) => (
                        <TableRow 
                          key={index}
                          sx={{
                            bgcolor: row.status === 'حضور نداشتند و تحویل نشد'
                              ? '#ffc90021'
                              : row.status === 'مشخص نیست'
                                ? 'inherit'
                                : '#4caf501c',
                            borderRadius: '20px',
                          }}
                        >
                          <TableCell align="center">{convertToPersian(page * rowsPerPage + index + 1)}</TableCell>
                          <TableCell align="center">{formatDateTime(row.date)}</TableCell>
                          <TableCell align="center">{row.name}</TableCell>
                          <TableCell align="center">{convertToPersian(row.floor)}</TableCell>
                          <TableCell align="center">{row.food}</TableCell>
                          <TableCell align="center">{convertToPersian(row.count)}</TableCell>
                          <TableCell align="center">{row.type}</TableCell>
                          <TableCell align="center">{row.status}</TableCell>
                          {/* <TableCell align="center">{row.comment}</TableCell> */}
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            <Stack spacing={2} alignItems="center" mt={2}>
              <Pagination
                count={pageCount}
                page={page+1}
                onChange={(e, value) => setPage(value-1)}
                shape="rounded"
                color="primary"
              />
            </Stack>
            <Typography 
              variant="h6" 
              mt={5} 
              mb={2} 
              fontWeight="bold"
              sx={{
                textAlign: { xs: 'center', sm: 'right' },
                marginBottom: { xs: '10px', sm: 3 },
                fontSize: { xs: '14px', sm: '16px' },
              }}
            >
              خلاصه رزروها
            </Typography>
            <TableContainer component={Paper} sx={{ width: { xs: '350px', sm: '100%' } }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    {/* <TableCell align="center">ردیف</TableCell> */}
                    <TableCell align="center">طبقه</TableCell>
                    <TableCell align="center">تاریخ</TableCell>
                    <TableCell align="center">نام غذا</TableCell>
                    <TableCell align="center">تعداد</TableCell>
                    <TableCell align="center">مهمان</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {totalRows
                    .slice(summaryPage * summaryPerPage, summaryPage * summaryPerPage + summaryPerPage)
                    .map((item, index) => (
                    <TableRow key={index}>
                      {/* <TableCell align="center">{convertToPersian(summaryPage * summaryPerPage + index + 1)}</TableCell> */}
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
                          {convertToPersian(item.floor)}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{formatDateTime(item.date)}</TableCell>
                      <TableCell align="center">{item.food}</TableCell>
                      <TableCell align="center">{convertToPersian(item.count)}</TableCell>
                      <TableCell align="center">{convertToPersian(item.guest === 0 ? 'ندارد' : item.guest)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>  
                    <TableCell 
                      align="center" 
                      colSpan={3}
                      sx={{
                        fontSize: { xs: '12px', sm: '14px' },
                        fontWeight: 'bold',
                      }} 
                    >
                      جمع کل
                    </TableCell>
                    <TableCell 
                      colSpan={4} 
                      align="center"
                      sx={{
                        fontSize: { xs: '12px', sm: '14px' },
                        fontWeight: 'bold',
                        borderRight: '2px solid rgba(0, 0, 0, 0.34)',
                      }} 
                    >
                      {convertToPersian(totalFoodCount)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
            <Stack spacing={2} alignItems="center" mt={2}>
              <Pagination
                count={summaryPageCount}
                page={summaryPage + 1}
                onChange={(e, value) => setSummaryPage(value - 1)}
                shape="rounded"
                color="primary"
              />
            </Stack>
          </Box>
        ) : (
          <Typography mt={3} color="text.secondary">
            لطفاً تاریخ و طبقه را انتخاب کرده و دکمه جستجو را بزنید.
          </Typography>
        )}
    </Box>
  );
};

export default ViewList;
