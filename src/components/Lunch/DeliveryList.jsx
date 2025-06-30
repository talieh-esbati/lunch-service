import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance/axiosWithAuth';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  Checkbox,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ToastContainer, toast } from 'react-toastify';
import dayjs from 'dayjs';
import jalaliPlugin from 'jalali-dayjs';
import 'react-toastify/dist/ReactToastify.css';
import convertToPersian from '../../assets/Converter/ConvertToPersian';

dayjs.extend(jalaliPlugin);

const DeliveryList = () => {
    const todayDate = dayjs().locale('fa').format('dddd ، D MMMM YYYY');
    const today = dayjs().startOf('day');
    const [deliveryType, setDeliveryType] = useState([]);
    const [totalRows, setTotalRows] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);

    useEffect(() => {
        fetch(' {Lunch_Service_Address}/api/Configuration/Init')
        .then(r => r.json())
        .then(data => setDeliveryType(data.enums.DeliveryTypeEnum.values || []))
        .catch(console.error);

        const from = today.format('YYYY-MM-DD');
        const to = today.format('YYYY-MM-DD');
        fetch(` {Lunch_Service_Address}/api/UserChoice/GetKitchenMenuReserved?fromDate=${from}&toDate=${to}`)
        .then(r => r.json())
        .then(data => {
            setTotalRows(
            (data.result.totalReserved || []).map(i => ({
                id: i.id,
                floor: i.floor,
                food: i.foodName,
                count: i.count
            }))
            );
            setFilteredRows(
            (data.result.usersChoices || []).map(i => ({
                id: i.id,
                userId: i.userId,
                name: i.userName || '---',
                kitchenMenuId: i.kitchenMenu.id,
                floor: i.floor,
                status: i.deliveryType
            }))
            );
        })
        .catch(console.error);
    }, []);

    if (totalRows.length === 0) {
        return (
            <Box p={2} flex={5}>
                <Box display="flex" justifyContent="center" mt={40}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }} align="center">
                        غذایی برای این روز رزرو نشده است
                    </Typography>
                </Box>
            </Box>
        );
    }

    console.log(filteredRows)

    const allDone = 
        filteredRows.length > 0 &&
        filteredRows.every(u => u.status != null && u.status !== 3);
    const floors = Array.from(new Set(filteredRows.map(u => u.floor))).sort((a, b) => a - b);
    const totalCountAllFloors = totalRows.reduce((sum, r) => sum + (r.count || 0), 0);

    const handleStatusChange = async (userId, kitchenMenuId, newStatus) => {
        try {
        await axiosInstance.post(
            ` {Lunch_Service_Address}/api/UserChoice/DeliverFoodToPerson?userId=${userId}&kitchenMenuId=${kitchenMenuId}&deliveryType=${newStatus}`
        );
        toast.success('وضعیت ارسال ثبت شد');
        setFilteredRows(rows =>
            rows.map(r =>
            r.userId === userId && r.kitchenMenuId === kitchenMenuId
                ? { ...r, status: newStatus }
                : r
            )
        );
        } catch {
        toast.error('خطا در ثبت وضعیت');
        }
    };

    return (
        <Box p={2} flex={5}>
            <ToastContainer position="bottom-right" autoClose={3000} rtl pauseOnHover />
            <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                textAlign: { xs: 'center', sm: 'right' },
                marginBottom: { xs: '10px', sm: 3 },
                fontSize: { xs: '14px', sm: '16px' }
                }}
            >
                لیست توزیع غذا
            </Typography>
            <Grid container spacing={2} mb={4} alignItems="stretch">
                <Grid item xs={12} sm={3}>
                    <Card sx={{ backgroundColor: '#e0f7fa', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, height: '100%', px: 2 }}>
                            <Typography sx={{ pl: 1, fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#006064' }}>
                                امروز :
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#006064' }}>
                                {convertToPersian(todayDate)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: '#e0f7fa', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, height: '100%', px: 2 }}>
                            <Typography sx={{ pl: 1, fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#006064' }}>
                                غذا :
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#006064' }}>
                                {totalRows[0]?.food}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: '#e0f7fa', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, height: '100%', px: 2 }}>
                            <Typography sx={{ pl: 1, fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#006064' }}>
                                تعداد کل :
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#006064' }}>
                                {convertToPersian(totalCountAllFloors)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card sx={{ backgroundColor: '#e0f7fa', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, height: '100%', px: 2 }}>
                            <Typography sx={{ pl: 1, fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#006064' }}>
                                وضعیت :
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', color: '#006064' }}>
                                {allDone ? 'تکمیل شده' : 'در حال انجام'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            {floors.map(floor => {
                const users = filteredRows.filter(u => u.floor === floor);
                const floorSummary = totalRows.find(r => r.floor === floor);
                const floorCount = floorSummary ? floorSummary.count : 0;

                return (
                <Accordion key={floor} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontSize: '14px',fontWeight: 'bold', pl:'4px' }}>
                            طبقه {convertToPersian(floor === null ? 'بدون طبقه' : floor)} :
                            <Box
                                component="span"
                                sx={{
                                    backgroundColor: '#e0f7fa',
                                    color: '#006064',
                                    px: 1,
                                    py: 0.2,
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    mr: 1,
                                    display: 'inline-block'
                                }}
                            >
                                {convertToPersian(floorCount)} عدد
                            </Box>
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            {users.map(user => (
                            <Grid item xs={6} sm={6} md={4} lg={3} key={user.id}>
                                <Card sx={{ position: 'relative' }}>
                                    <Checkbox
                                        checked={user.status === 0}
                                        onChange={() => handleStatusChange(user.userId, user.kitchenMenuId, 0)}
                                        sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, padding: '4px' }}
                                    />
                                    <CardContent>
                                        <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#006BD6', mb: 1 }}>
                                        {user.name}
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={user.status ?? ''}
                                                onChange={e => handleStatusChange(user.userId, user.kitchenMenuId, Number(e.target.value))}
                                                sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold' }}
                                            >
                                                <MenuItem value="">
                                                    <em>انتخاب کنید</em>
                                                </MenuItem>
                                                {deliveryType.map(dt => (
                                                    <MenuItem
                                                        key={dt.id}
                                                        value={dt.id}
                                                        sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold' }}
                                                    >
                                                        {dt.description}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </CardContent>
                                </Card>
                            </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            );
        })}
        </Box>
    );
};

export default DeliveryList;
